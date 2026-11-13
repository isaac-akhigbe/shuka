import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import db
import sync
from caller import place_call
from climate import all_states_summary, clear_cache, climate_profile, has_data, season_rain_series
from engine import PRIORITIES, recommend
from mock_data import get_mock_locations
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


# ---------- climate (real NASA data) ----------

@app.get("/states")
def list_states():
    """Map summary for every state that has NASA data."""
    return all_states_summary()


@app.get("/states/{state_id}")
def get_state(state_id: str):
    """Full climate profile for one state, plus last season's daily rain for the chart."""
    _check_state(state_id)
    profile = climate_profile(state_id)
    return {
        **STATES_BY_ID[state_id],
        **profile,
        "latestSeasonRain": season_rain_series(state_id, profile["lastYear"]),
    }


# ---------- rotations ----------

@app.get("/options")
def options():
    """Choices for the 'plan my rotation' form."""
    return {
        "currentRotations": [{"id": r, "name": ROTATIONS[r]["name"]} for r in CURRENT_OPTIONS],
        "priorities": [{"id": k, "label": v["label"]} for k, v in PRIORITIES.items()],
    }


@app.get("/recommend")
def get_recommendation(state: str, current: str = "maize-maize", priority: str = "balanced"):
    _check_state(state)
    try:
        return recommend(state, current, priority)
    except KeyError as err:
        raise HTTPException(status_code=400, detail=str(err))


# ---------- old mock endpoint (frontend still uses it until we switch) ----------

@app.get("/locations")
def list_locations():
    return get_mock_locations()


# ---------- voice alert ----------

@app.post("/alert/{state_id}")
def send_alert(state_id: str):
    if state_id not in STATES_BY_ID:
        raise HTTPException(status_code=404, detail="State not found")

    # Twilio trial accounts can only call verified numbers,
    # so for the demo every alert goes to one phone.
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

    return {"status": "calling", "state": STATES_BY_ID[state_id]["name"], "callId": call_id}
