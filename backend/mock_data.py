import random
from datetime import date, timedelta

YEARS_ANALYSED = 26

# (id, name, lat, lon, false_onset_years, farmers_registered)
STATES = [
    ("kano", "Kano", 12.0, 8.52, 8, 142),
    ("kaduna", "Kaduna", 10.52, 7.44, 5, 118),
    ("katsina", "Katsina", 12.99, 7.6, 9, 97),
    ("sokoto", "Sokoto", 13.06, 5.24, 11, 76),
    ("zamfara", "Zamfara", 12.16, 6.66, 9, 64),
    ("kebbi", "Kebbi", 12.45, 4.2, 10, 71),
    ("jigawa", "Jigawa", 11.76, 9.34, 9, 88),
    ("bauchi", "Bauchi", 10.31, 9.84, 6, 93),
    ("gombe", "Gombe", 10.29, 11.17, 6, 52),
    ("yobe", "Yobe", 11.75, 11.96, 11, 48),
    ("borno", "Borno", 11.85, 13.16, 12, 39),
    ("adamawa", "Adamawa", 9.21, 12.48, 5, 61),
    ("taraba", "Taraba", 8.89, 11.36, 3, 44),
    ("plateau", "Plateau", 9.9, 8.86, 3, 57),
    ("nasarawa", "Nasarawa", 8.49, 8.52, 3, 49),
    ("benue", "Benue", 7.73, 8.54, 2, 83),
    ("kogi", "Kogi", 7.8, 6.74, 2, 46),
    ("kwara", "Kwara", 8.5, 4.55, 3, 42),
    ("niger", "Niger", 9.61, 6.56, 5, 104),
    ("fct", "FCT Abuja", 9.06, 7.49, 4, 35),
]

MESSAGES = {
    "high": ("wait", "Dry spell likely in next 10 days. Do not plant yet."),
    "medium": ("wait", "Rains unstable. Wait for confirmation before planting."),
    "low": ("plant", "Rains established. Safe to plant."),
}


def risk_level_for(percent: int) -> str:
    if percent >= 30:
        return "high"
    if percent >= 15:
        return "medium"
    return "low"


def mock_rain(state_id: str, level: str) -> list[dict]:
    """30 days of fake rain. High risk states get the false onset pattern."""
    rng = random.Random(state_id)  # same state name = same numbers every time
    start = date(2026, 5, 1)
    days = []

    for i in range(30):
        if level == "high":
            if 8 <= i <= 10:
                mm = 6 + rng.random() * 6  # onset burst
            elif 10 < i < 26:
                mm = 0  # dry spell
            else:
                mm = rng.random() * 4 if rng.random() < 0.2 else 0
        elif level == "medium":
            mm = rng.random() * 12 if rng.random() < 0.35 else 0
        else:
            mm = 3 + rng.random() * 15 if rng.random() < 0.55 else 0

        days.append({"date": (start + timedelta(days=i)).isoformat(), "mm": round(mm, 1)})

    return days


def get_mock_locations() -> list[dict]:
    locations = []
    for state_id, name, lat, lon, false_onset_years, farmers in STATES:
        risk_percent = round(false_onset_years / YEARS_ANALYSED * 100)
        level = risk_level_for(risk_percent)
        verdict, message = MESSAGES[level]
        locations.append(
            {
                "id": state_id,
                "name": name,
                "lat": lat,
                "lon": lon,
                "riskPercent": risk_percent,
                "falseOnsetYears": false_onset_years,
                "yearsAnalysed": YEARS_ANALYSED,
                "riskLevel": level,
                "verdict": verdict,
                "verdictMessage": message,
                "last30DaysRain": mock_rain(state_id, level),
                "farmersRegistered": farmers,
            }
        )
    return locations