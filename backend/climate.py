"""Turns raw NASA POWER daily data into a climate profile for each state.

Definitions (kept simple so they can be explained to judges and farmers):
- Wet day: 1 mm of rain or more.
- Candidate onset: the first day from 1 April where 3 days of rain add up to 20 mm or more.
- False onset: a candidate onset followed by a dry spell of more than 7 days within the next 30 days
  (the onset rule commonly used for the Sahel and Sudan savanna, after Sivakumar 1988).
- Real onset: the first candidate onset that is NOT followed by such a dry spell.
- Cessation: the first day from 1 September after which less than 10 mm falls in 20 days.
- Heat stress day: a day in the growing season with max temperature of 35 °C or more.

Data quality: NASA POWER rainfall has some physically impossible values in a few
years (e.g. over 1,000 mm in one day). A season is left out of the analysis if any
day has more than 300 mm, or its total is more than 1.8 times the state's median.
Left-out years are listed in the profile so the check is transparent.
"""

import statistics
from datetime import date, timedelta
from functools import lru_cache

import db
from states import STATES, STATES_BY_ID

WET_DAY_MM = 1.0
ONSET_3DAY_MM = 20.0
DRY_SPELL_DAYS = 8  # "more than 7 days"
DRY_SPELL_WINDOW = 30
CESSATION_WINDOW = 20
CESSATION_MM = 10.0
HEAT_C = 35.0
MAX_DAILY_MM = 300.0
MAX_TOTAL_RATIO = 1.8


# ---------- loading ----------

@lru_cache(maxsize=None)
def load_state(state_id: str) -> dict:
    """All daily NASA data for a state, from the database."""
    rows = db.get_days(state_id)
    if not rows:
        raise FileNotFoundError(f"No NASA data for {state_id}. Run python sync.py first.")
    rain, tmax, soil = {}, {}, {}
    for r in rows:
        d = date.fromisoformat(r["day"])
        rain[d] = r["rain"]
        if r["tmax"] is not None:
            tmax[d] = r["tmax"]
        if r["soil"] is not None:
            soil[d] = r["soil"]
    return {"rain": rain, "tmax": tmax, "soil": soil, "end": rows[-1]["day"]}


def has_data(state_id: str) -> bool:
    return db.last_day(state_id) is not None


def clear_cache() -> None:
    """Call after new data arrives so profiles are recalculated."""
    load_state.cache_clear()
    climate_profile.cache_clear()


# ---------- one season ----------

def _rain(rain: dict, d: date) -> float:
    return rain.get(d, 0.0)


def _sum(rain: dict, start: date, days: int) -> float:
    return sum(_rain(rain, start + timedelta(days=i)) for i in range(days))


def _longest_dry_run(rain: dict, start: date, days: int) -> int:
    longest = current = 0
    for i in range(days):
        if _rain(rain, start + timedelta(days=i)) < WET_DAY_MM:
            current += 1
            longest = max(longest, current)
        else:
            current = 0
    return longest


def analyse_season(data: dict, year: int) -> dict | None:
    rain, tmax, soil = data["rain"], data["tmax"], data["soil"]

    # Need data up to end of October to judge a season
    if date(year, 10, 31) not in rain:
        return None

    first_candidate = None
    real_onset = None
    d = date(year, 4, 1)
    while d <= date(year, 8, 31):
        if _sum(rain, d, 3) >= ONSET_3DAY_MM:
            onset_day = d + timedelta(days=2)
            dry = _longest_dry_run(rain, onset_day + timedelta(days=1), DRY_SPELL_WINDOW)
            if first_candidate is None:
                first_candidate = {"date": onset_day, "dry_spell_after": dry}
            if dry < DRY_SPELL_DAYS:
                real_onset = onset_day
                break
            # skip past this failed start before looking again
            d = onset_day + timedelta(days=1)
            continue
        d += timedelta(days=1)

    year_days = [date(year, 4, 1) + timedelta(days=i) for i in range(214)]
    max_day = max(_rain(rain, x) for x in year_days)

    if first_candidate is None or real_onset is None:
        return {
            "year": year,
            "max_daily": round(max_day, 1),
            "false_onset": first_candidate is not None,
            "no_season_detected": True,
            "seasonal_rain": round(_sum(rain, date(year, 4, 1), 214), 1),
        }

    false_onset = first_candidate["date"] != real_onset

    cessation = None
    d = max(date(year, 9, 1), real_onset + timedelta(days=30))
    while d <= date(year, 11, 30):
        if _sum(rain, d, CESSATION_WINDOW) < CESSATION_MM:
            cessation = d
            break
        d += timedelta(days=1)
    if cessation is None:
        cessation = date(year, 11, 30)

    season_days = (cessation - real_onset).days
    season_dates = [real_onset + timedelta(days=i) for i in range(season_days)]
    heat_days = sum(1 for x in season_dates if tmax.get(x, 0) >= HEAT_C)
    soil_vals = [soil[x] for x in season_dates if x in soil]

    return {
        "year": year,
        "max_daily": round(max_day, 1),
        "false_onset": false_onset,
        "first_rains": first_candidate["date"].isoformat(),
        "real_onset": real_onset.isoformat(),
        "real_onset_doy": real_onset.timetuple().tm_yday,
        "cessation": cessation.isoformat(),
        "season_length": season_days,
        "seasonal_rain": round(_sum(rain, date(year, 4, 1), 214), 1),  # 1 Apr to 31 Oct
        "season_rain": round(sum(_rain(rain, x) for x in season_dates), 1),
        "heat_days": heat_days,
        "longest_dry_spell": _longest_dry_run(rain, real_onset, season_days),
        "soil_wetness": round(statistics.mean(soil_vals), 3) if soil_vals else None,
    }


# ---------- whole profile ----------

def _pct(values: list, p: float) -> float:
    s = sorted(values)
    k = (len(s) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def _doy_to_label(doy: float) -> str:
    d = date(2001, 1, 1) + timedelta(days=round(doy) - 1)
    return d.strftime("%-d %B")


def _change(old: float, new: float) -> float:
    return round((new - old) / old * 100, 1) if old else 0.0


def typical_practice(dry_year_rain: float) -> str:
    """A sensible starting guess for what farmers grow, from how much rain a dry year brings.
    Far north (dry) is millet country, the middle is guinea corn, the wetter south grows more maize.
    The officer can always change it."""
    if dry_year_rain < 500:
        return "milletcowpea-milletcowpea"
    if dry_year_rain < 800:
        return "sorghumcowpea-sorghumcowpea"
    return "maize-maize"


def risk_level(rate: float) -> str:
    if rate >= 0.30:
        return "high"
    if rate >= 0.15:
        return "medium"
    return "low"


@lru_cache(maxsize=None)
def climate_profile(state_id: str) -> dict:
    data = load_state(state_id)
    years = sorted({d.year for d in data["rain"]})
    all_seasons = [s for y in years if (s := analyse_season(data, y))]

    # Data quality check (see top of file)
    median_total = statistics.median(s["seasonal_rain"] for s in all_seasons)
    excluded = [
        s["year"] for s in all_seasons
        if s["max_daily"] > MAX_DAILY_MM or s["seasonal_rain"] > MAX_TOTAL_RATIO * median_total
    ]
    seasons = [s for s in all_seasons if s["year"] not in excluded]
    full = [s for s in seasons if not s.get("no_season_detected")]

    n = len(seasons)
    false_years = [s["year"] for s in seasons if s["false_onset"]]
    rate = len(false_years) / n if n else 0

    onset_doys = [s["real_onset_doy"] for s in full]
    cessation_doys = [date.fromisoformat(s["cessation"]).timetuple().tm_yday for s in full]
    lengths = [s["season_length"] for s in full]
    rains = [s["seasonal_rain"] for s in seasons]
    heat = [s["heat_days"] for s in full]
    dry = [s["longest_dry_spell"] for s in full]
    soil = [s["soil_wetness"] for s in full if s["soil_wetness"] is not None]

    # Then vs now, to show change over time
    mid = years[0] + (years[-1] - years[0]) // 2
    early = [s for s in seasons if s["year"] <= mid]
    late = [s for s in seasons if s["year"] > mid]

    def avg(rows, key):
        vals = [r[key] for r in rows if key in r and r[key] is not None]
        return statistics.mean(vals) if vals else 0

    def rate_of(rows):
        return sum(r["false_onset"] for r in rows) / len(rows) if rows else 0

    latest = seasons[-1] if seasons else None

    return {
        "excludedYears": excluded,
        "yearsAnalysed": n,
        "firstYear": seasons[0]["year"] if seasons else None,
        "lastYear": latest["year"] if latest else None,
        "falseOnsetYears": len(false_years),
        "falseOnsetYearList": false_years,
        "falseOnsetRate": round(rate, 3),
        "riskLevel": risk_level(rate),
        "safePlantingFrom": _doy_to_label(statistics.median(onset_doys)) if onset_doys else None,
        "safePlantingBy": _doy_to_label(_pct(onset_doys, 0.75)) if onset_doys else None,
        "typicalSeasonEnd": _doy_to_label(statistics.median(cessation_doys)) if cessation_doys else None,
        "seasonLengthMedian": round(statistics.median(lengths)) if lengths else None,
        "seasonLengthDryYear": round(_pct(lengths, 0.2)) if lengths else None,
        "seasonalRainMean": round(statistics.mean(rains)) if rains else None,
        "seasonalRainDryYear": round(_pct(rains, 0.2)) if rains else None,
        "rainVariabilityPct": round(statistics.pstdev(rains) / statistics.mean(rains) * 100)
        if rains and statistics.mean(rains) else None,
        "heatDaysMean": round(statistics.mean(heat)) if heat else None,
        "longestDrySpellMedian": round(statistics.median(dry)) if dry else None,
        "soilWetnessMean": round(statistics.mean(soil), 2) if soil else None,
        "trend": {
            "splitYear": mid,
            "rainChangePct": _change(avg(early, "seasonal_rain"), avg(late, "seasonal_rain")),
            "falseOnsetRateEarly": round(rate_of(early), 2),
            "falseOnsetRateLate": round(rate_of(late), 2),
            "heatDaysEarly": round(avg(early, "heat_days")),
            "heatDaysLate": round(avg(late, "heat_days")),
        },
        "latestSeason": latest,
        "seasons": seasons,
    }


def season_rain_series(state_id: str, year: int) -> list[dict]:
    """Daily rain from 1 April to 31 July of a year, for the chart."""
    rain = load_state(state_id)["rain"]
    start = date(year, 4, 1)
    return [
        {"date": (start + timedelta(days=i)).isoformat(),
         "mm": round(_rain(rain, start + timedelta(days=i)), 1)}
        for i in range(122)
    ]


def all_states_summary() -> list[dict]:
    out = []
    for s in STATES:
        if not has_data(s["id"]):
            continue
        p = climate_profile(s["id"])
        out.append({
            **s,
            "riskLevel": p["riskLevel"],
            "falseOnsetRate": p["falseOnsetRate"],
            "falseOnsetYears": p["falseOnsetYears"],
            "yearsAnalysed": p["yearsAnalysed"],
            "seasonalRainMean": p["seasonalRainMean"],
            "seasonLengthMedian": p["seasonLengthMedian"],
            "safePlantingFrom": p["safePlantingFrom"],
            "typicalPractice": typical_practice(p["seasonalRainDryYear"]),
        })
    return out


__all__ = ["climate_profile", "all_states_summary", "season_rain_series", "has_data",
           "clear_cache", "STATES_BY_ID"]
