from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from mock_data import get_mock_locations

app = FastAPI(title="Shuka API")

# Allow the Next.js frontend (running on port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "service": "shuka"}


@app.get("/locations")
def list_locations():
    return get_mock_locations()


@app.get("/locations/{location_id}")
def get_location(location_id: str):
    for loc in get_mock_locations():
        if loc["id"] == location_id:
            return loc
    raise HTTPException(status_code=404, detail="Location not found")