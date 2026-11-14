import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import auth
import db
import farmers
import sync
from caller import place_call
from climate import all_states_summary, clear_cache, climate_profile, has_data, season_rain_series
from engine import PRIORITIES, recommend
from rotations import CURRENT_OPTIONS, ROTATIONS
from states import STATES_BY_ID

# Reads secrets from the .env file into os.environ
load_dotenv()

SYNC_EVERY = timedelta(hours=24)


async def daily_sync():
    """Background job. Fetches new NASA days once a day, forever."""
    while True:
        last = db.status()["lastSyncedAt"]
        due = last is None or datetime.now(timezone.utc) - datetime.fromisoformat(last) >= SYNC_EVERY
        if due:
            try:
                await asyncio.to_thread(sync.sync_all)  # runs without freezing the API
                clear_cache()
            except Exception as err:
                print(f"NASA sync failed, will retry later: {err}")
        await asyncio.sleep(60 * 60)  # check again in an hour


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    auth.seed_demo_officer()
    sync.import_json_files()  # instant, uses files already downloaded
    task = asyncio.create_task(daily_sync())
    yield
    task.cancel()


app = FastAPI(title="Shuka API", lifespan=lifespan)

# Allow the Next.js frontend (running on port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_state(state_id: str):
    if state_id not in STATES_BY_ID:
        raise HTTPException(status_code=404, detail="State not found")
    if not has_data(state_id):
        raise HTTPException(status_code=503, detail="NASA data not downloaded for this state yet")


@app.get("/")
def health():
    return {"status": "ok", "service": "shuka"}


@app.get("/data-status")
def data_status():
    """When NASA data was last updated, shown on the dashboard."""
    s = db.status()
    return {"lastSyncedAt": s["lastSyncedAt"], "latestDataDay": s["latestDataDay"], "totalDays": s["totalDays"]}


# ---------- climate (public, real NASA data) ----------

@app.get("/states")
def list_states():
    """Map summary for every state that has NASA data, plus how many farmers are registered."""
    counts = farmers.counts_by_state()
    return [{**s, "farmerCount": counts.get(s["id"], 0)} for s in all_states_summary()]


@app.get("/states/{state_id}")
def get_state(state_id: str):
    """Full climate profile for one state, plus last season's daily rain for the chart."""
    _check_state(state_id)
    profile = climate_profile(state_id)
    return {
        **STATES_BY_ID[state_id],
        **profile,
        "farmerCount": farmers.counts_by_state().get(state_id, 0),
        "latestSeasonRain": season_rain_series(state_id, profile["lastYear"]),
    }


# ---------- rotations (public) ----------

@app.get("/options")
def options():
    """Choices for the 'build advice' form."""
    return {
        "currentRotations": [{"id": r, "name": ROTATIONS[r]["name"]} for r in CURRENT_OPTIONS],
        "priorities": [{"id": k, "label": v["label"]} for k, v in PRIORITIES.items()],
        "languages": farmers.LANGUAGES,
    }


@app.get("/recommend")
def get_recommendation(state: str, current: str = "maize-maize", priority: str = "balanced"):
    _check_state(state)
    try:
        return recommend(state, current, priority)
    except KeyError as err:
        raise HTTPException(status_code=400, detail=str(err))


# ---------- officer sign-in ----------

class LoginBody(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(body: LoginBody):
    return auth.login(body.username, body.password)


@app.get("/auth/me")
def me(officer: dict = Depends(auth.current_officer)):
    return {k: v for k, v in officer.items() if k != "token"}


@app.post("/auth/logout")
def logout(officer: dict = Depends(auth.current_officer)):
    auth.logout(officer["token"])
    return {"status": "signed out"}


# ---------- farmers (officers only) ----------

class FarmerBody(BaseModel):
    name: str
    phone: str
    lga: str | None = None
    language: str = "Hausa"
    crops: str | None = None
    consent: bool = True
    stateId: str | None = None  # only admins may set this


class CsvBody(BaseModel):
    csv: str
    stateId: str | None = None  # only admins may set this


def _target_state(officer: dict, requested: str | None) -> str:
    """Officers always work in their own state. Admins must say which state."""
    if officer["role"] != "admin" and requested and requested != officer["stateId"]:
        raise HTTPException(status_code=403, detail="You can only add farmers in your own state")
    state_id = requested if officer["role"] == "admin" else officer["stateId"]
    if not state_id or state_id not in STATES_BY_ID:
        raise HTTPException(status_code=400, detail="Choose a valid state")
    return state_id


@app.get("/farmers")
def get_farmers(state: str | None = None, officer: dict = Depends(auth.current_officer)):
    state_id = state if officer["role"] == "admin" else officer["stateId"]
    return farmers.list_farmers(state_id)


@app.post("/farmers")
def create_farmer(body: FarmerBody, officer: dict = Depends(auth.current_officer)):
    state_id = _target_state(officer, body.stateId)
    try:
        return farmers.add_farmer(body.model_dump(), state_id, officer["id"])
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@app.post("/farmers/import")
def import_farmers(body: CsvBody, officer: dict = Depends(auth.current_officer)):
    state_id = _target_state(officer, body.stateId)
    if len(body.csv) > 2_000_000:
        raise HTTPException(status_code=413, detail="File too large (max 2 MB)")
    try:
        return farmers.import_csv(body.csv, state_id, officer["id"])
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@app.delete("/farmers/{farmer_id}")
def remove_farmer(farmer_id: int, officer: dict = Depends(auth.current_officer)):
    farmer = farmers.get_farmer(farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    auth.require_state_access(officer, farmer["stateId"])
    farmers.delete_farmer(farmer_id)
    return {"status": "deleted"}


# ---------- voice alert (officers only) ----------

@app.post("/alert/{state_id}")
def send_alert(state_id: str, officer: dict = Depends(auth.current_officer)):
    if state_id not in STATES_BY_ID:
        raise HTTPException(status_code=404, detail="State not found")
    auth.require_state_access(officer, state_id)

    registered = farmers.counts_by_state().get(state_id, 0)
    if registered == 0:
        raise HTTPException(status_code=400, detail="No farmers registered in this state yet")

    # Twilio trial accounts can only call verified numbers,
    # so for the demo the call goes to one verified phone instead of every farmer.
    to_number = os.getenv("DEMO_PHONE_NUMBER")
    if not to_number:
        raise HTTPException(status_code=500, detail="DEMO_PHONE_NUMBER is not set in .env")

    risk = climate_profile(state_id)["riskLevel"] if has_data(state_id) else "high"
    try:
        call_id = place_call(to_number, risk)
    except KeyError as missing:
        raise HTTPException(status_code=500, detail=f"Missing setting in .env: {missing}")
    except Exception as err:
        raise HTTPException(status_code=502, detail=f"Call failed: {err}")

    return {
        "status": "calling",
        "state": STATES_BY_ID[state_id]["name"],
        "farmers": registered,
        "callId": call_id,
    }
