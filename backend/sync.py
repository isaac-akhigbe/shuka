"""Keeps the database up to date with NASA POWER.

- First run: imports any JSON files in data/nasa/ (so nothing is downloaded twice),
  then downloads full history from 2000 for any state still missing.
- Every run after that: downloads only the days since the newest day we have.

Run by hand:      python sync.py
Runs by itself:   the API calls sync_all() once a day in the background.
"""

import json
import time
import urllib.request
from datetime import date, timedelta
from pathlib import Path

import db
from states import STATES

PARAMETERS = "PRECTOTCORR,T2M_MAX,GWETROOT"
HISTORY_START = date(2000, 1, 1)
NASA_DELAY_DAYS = 3  # POWER publishes data a few days after the fact
MISSING = -999
JSON_DIR = Path(__file__).resolve().parent / "data" / "nasa"


def _value(v):
    return None if v is None or v <= MISSING else float(v)


def _to_rows(rain: dict, tmax: dict, soil: dict) -> list[tuple]:
    rows = []
    for key in sorted(rain):
        r = _value(rain.get(key))
        if r is None:
            continue  # NASA hasn't filled this day yet, fetch it next time
        day = f"{key[:4]}-{key[4:6]}-{key[6:8]}"
        rows.append((day, r, _value(tmax.get(key)), _value(soil.get(key))))
    return rows


def fetch_from_nasa(lat: float, lon: float, start: date, end: date) -> list[tuple]:
    url = (
        "https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters={PARAMETERS}&community=AG"
        f"&latitude={lat}&longitude={lon}"
        f"&start={start:%Y%m%d}&end={end:%Y%m%d}&format=JSON"
    )
    with urllib.request.urlopen(url, timeout=180) as resp:
        p = json.load(resp)["properties"]["parameter"]
    return _to_rows(p["PRECTOTCORR"], p["T2M_MAX"], p["GWETROOT"])


def import_json_files() -> None:
    """One-off: load JSON files downloaded earlier, for states the database doesn't have."""
    for state in STATES:
        path = JSON_DIR / f"{state['id']}.json"
        if not path.exists() or db.last_day(state["id"]):
            continue
        raw = json.loads(path.read_text())
        n = db.save_days(state["id"], _to_rows(raw["rain"], raw["tmax"], raw["soil"]))
        print(f"{state['name']}: imported {n} days from JSON")


def sync_state(state: dict) -> int:
    last = db.last_day(state["id"])
    start = date.fromisoformat(last) + timedelta(days=1) if last else HISTORY_START
    end = date.today() - timedelta(days=NASA_DELAY_DAYS)

    if start > end:
        db.mark_synced(state["id"])
        return 0

    for attempt in range(3):
        try:
            rows = fetch_from_nasa(state["lat"], state["lon"], start, end)
            break
        except Exception as err:
            print(f"{state['name']}: attempt {attempt + 1} failed ({err})")
            time.sleep(5)
    else:
        return 0  # try again on the next sync

    n = db.save_days(state["id"], rows)
    db.mark_synced(state["id"])
    return n


def sync_all() -> dict:
    db.init()
    import_json_files()
    added = {}
    for state in STATES:
        n = sync_state(state)
        added[state["id"]] = n
        print(f"{state['name']}: +{n} new days")
        time.sleep(1)  # be polite to NASA's servers
    return added


if __name__ == "__main__":
    sync_all()
    print(db.status()["latestDataDay"], "is the newest day in the database")
