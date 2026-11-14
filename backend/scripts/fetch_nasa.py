"""Download NASA POWER daily data for every state and save it as JSON.

Run once from the backend folder:
    python scripts/fetch_nasa.py

It saves one file per state in data/nasa/, e.g. data/nasa/kano.json.
Files that already exist are skipped, so you can re-run it safely if it stops.
"""

import json
import sys
import time
import urllib.request
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from states import STATES  # noqa: E402

# PRECTOTCORR = rainfall (mm/day)
# T2M_MAX     = maximum air temperature at 2 m (°C)
# GWETROOT    = root-zone soil wetness (0 = dry, 1 = saturated)
PARAMETERS = "PRECTOTCORR,T2M_MAX,GWETROOT"
START = "20000101"
# POWER data runs a few days behind today
END = (date.today() - timedelta(days=7)).strftime("%Y%m%d")

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "nasa"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def fetch(lat: float, lon: float) -> dict:
    url = (
        "https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters={PARAMETERS}&community=AG"
        f"&latitude={lat}&longitude={lon}"
        f"&start={START}&end={END}&format=JSON"
    )
    with urllib.request.urlopen(url, timeout=180) as resp:
        return json.load(resp)


def main():
    for i, state in enumerate(STATES, start=1):
        out_file = OUT_DIR / f"{state['id']}.json"
        if out_file.exists():
            print(f"[{i}/{len(STATES)}] {state['name']}: already downloaded, skipping")
            continue

        print(f"[{i}/{len(STATES)}] {state['name']}: downloading...", flush=True)
        for attempt in range(3):
            try:
                raw = fetch(state["lat"], state["lon"])
                break
            except Exception as err:
                print(f"   attempt {attempt + 1} failed: {err}")
                time.sleep(5)
        else:
            print(f"   giving up on {state['name']}, run the script again later")
            continue

        # Keep only what we need, to make the files smaller
        params = raw["properties"]["parameter"]
        slim = {
            "state": state,
            "source": "NASA POWER daily point API, community AG",
            "start": START,
            "end": END,
            "rain": params["PRECTOTCORR"],
            "tmax": params["T2M_MAX"],
            "soil": params["GWETROOT"],
        }
        out_file.write_text(json.dumps(slim))
        print(f"   saved {out_file.name}")
        time.sleep(1)  # be polite to NASA's servers

    print("Done.")


if __name__ == "__main__":
    main()
