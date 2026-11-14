"""Compares crop rotations for a state using its NASA climate profile.

Every score is a simple, explainable rule (0 to 100), so a farmer, an extension
officer or a judge can see exactly why a rotation ranked where it did.
"""

from climate import climate_profile
from crops import CROPS
from rotations import ROTATIONS
from states import STATES_BY_ID

PRIORITIES = {
    "balanced": {"label": "No single main problem", "weights": {"water": 0.3, "climate": 0.3, "soil": 0.2, "income": 0.2}},
    "water": {"label": "Not enough rain for their crops", "weights": {"water": 0.45, "climate": 0.3, "soil": 0.1, "income": 0.15}},
    "soil": {"label": "Soil is tired, needs more fertiliser each year", "weights": {"water": 0.15, "climate": 0.25, "soil": 0.45, "income": 0.15}},
    "income": {"label": "Harvest doesn't earn enough", "weights": {"water": 0.15, "climate": 0.25, "soil": 0.15, "income": 0.45}},
    "risk": {"label": "Crops die in dry spells", "weights": {"water": 0.25, "climate": 0.5, "soil": 0.1, "income": 0.15}},
}


def _clamp(x: float) -> float:
    return max(0.0, min(100.0, x))


# ---------- crop level ----------

def water_fit(crop: dict, profile: dict) -> float:
    """Does a dry year's rain cover what the crop needs?"""
    rain = profile["seasonalRainDryYear"]
    lo, hi = crop["waterNeedMm"]
    if rain >= hi:
        return 100.0
    if rain >= lo:
        return 60 + 40 * (rain - lo) / (hi - lo)
    if rain >= 0.7 * lo:
        return 60 * (rain - 0.7 * lo) / (0.3 * lo)
    return 0.0


def season_fit(crop: dict, profile: dict) -> float:
    """Is a dry year's growing season long enough for the crop to mature?"""
    length = profile["seasonLengthDryYear"]
    lo, hi = crop["daysToMaturity"]
    if length >= hi:
        return 100.0
    if length >= lo:
        return 60 + 40 * (length - lo) / (hi - lo)
    if length >= 0.85 * lo:
        return 60 * (length - 0.85 * lo) / (0.15 * lo)
    return 0.0


def resilience(crop: dict, profile: dict) -> float:
    """Drought and heat tolerance, weighted by how much this state needs them."""
    # How much does this state need drought tolerance? More if rain is low or unreliable.
    dryness = max(0.0, 1 - profile["seasonalRainDryYear"] / 800)
    w_drought = 0.1 + 1.5 * profile["falseOnsetRate"] + dryness
    w_heat = 0.1 + min(profile["heatDaysMean"] or 0, 60) / 40
    w_season = 0.6
    total = w_drought + w_heat + w_season
    score = (
        crop["droughtTolerance"] / 5 * w_drought
        + crop["heatTolerance"] / 5 * w_heat
        + season_fit(crop, profile) / 100 * w_season
    ) / total
    return _clamp(score * 100)


# ---------- rotation level ----------

def _join(names: list[str]) -> str:
    """["Millet", "Beans (cowpea)"] -> "millet and beans" (lowercase, for mid-sentence)."""
    names = [n.split(" (")[0].lower() for n in names]
    if len(names) <= 1:
        return "".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


def _plural(names: list[str]) -> bool:
    """True if the subject needs a plural verb ("beans add", "millet and beans add")."""
    return len(names) > 1 or names[0].split(" (")[0].endswith("s")


def _cap(text: str) -> str:
    return text[:1].upper() + text[1:]


def _crops_in(rotation: dict) -> list[str]:
    return [c for season in rotation["seasons"] for c in season]


def soil_score(rotation: dict) -> float:
    seasons = rotation["seasons"]
    crops = _crops_in(rotation)
    legume_seasons = sum(any(CROPS[c]["fixesNitrogen"] for c in s) for s in seasons)
    families = {CROPS[c]["family"] for c in crops}
    avg_benefit = sum(CROPS[c]["soilBenefit"] for c in crops) / len(crops)
    same_crop_repeated = seasons[0] == seasons[1]

    score = (
        legume_seasons / len(seasons) * 50
        + min(len(families), 3) * 10
        + avg_benefit * 4
        - (20 if same_crop_repeated else 0)
    )
    return _clamp(score)


def income_score(rotation: dict, profile: dict) -> float:
    """Price x how much the crop is likely to yield here, plus fodder value."""
    crops = [CROPS[c] for c in _crops_in(rotation)]
    per_crop = []
    for c in crops:
        likely_yield = c["yieldPotential"] * water_fit(c, profile) / 100
        per_crop.append(c["marketValue"] * 9 + likely_yield * 9 + c["fodderValue"] * 2)
    intercrop_bonus = 5 * sum(len(s) > 1 for s in rotation["seasons"])
    return _clamp(sum(per_crop) / len(per_crop) + intercrop_bonus)


def score_rotation(rotation_id: str, profile: dict, priority: str) -> dict:
    rotation = ROTATIONS[rotation_id]
    crops = [CROPS[c] for c in _crops_in(rotation)]

    scores = {
        "water": round(sum(water_fit(c, profile) for c in crops) / len(crops)),
        "climate": round(sum(resilience(c, profile) for c in crops) / len(crops)),
        "soil": round(soil_score(rotation)),
        "income": round(income_score(rotation, profile)),
    }
    weights = PRIORITIES[priority]["weights"]
    overall = round(sum(scores[k] * w for k, w in weights.items()))
    return {"id": rotation_id, "scores": scores, "overall": overall}


# ---------- explanations ----------

def explain(rotation_id: str, profile: dict, state_name: str, current_id: str) -> dict:
    rotation = ROTATIONS[rotation_id]
    crop_ids = list(dict.fromkeys(_crops_in(rotation)))
    crops = [CROPS[c] for c in crop_ids]
    years = f"{profile['firstYear']} to {profile['lastYear']}"

    evidence = [
        f"In {state_name}, the first rains were followed by a dry spell of more than 7 days "
        f"in {profile['falseOnsetYears']} of {profile['yearsAnalysed']} seasons (NASA POWER, {years}).",
    ]
    t = profile["trend"]
    if t["falseOnsetRateLate"] - t["falseOnsetRateEarly"] >= 0.15:
        evidence.append(
            f"False starts are becoming more common here, from {round(t['falseOnsetRateEarly'] * 100)}% of seasons "
            f"up to {t['splitYear']} to {round(t['falseOnsetRateLate'] * 100)}% since."
        )
    evidence += [
        f"In a dry year, {state_name} gets about {profile['seasonalRainDryYear']} mm of rain from April "
        f"to October, and the growing season lasts about {profile['seasonLengthDryYear']} days.",
    ]
    for c in crops:
        lo, hi = c["waterNeedMm"]
        dlo, dhi = c["daysToMaturity"]
        evidence.append(f"{c['name']} typically needs {lo} to {hi} mm of water and {dlo} to {dhi} days to mature.")

    benefits, risks = [], []

    if any(c["fixesNitrogen"] for c in crops):
        legume_names = [c["name"] for c in crops if c["fixesNitrogen"]]
        verb = "add" if _plural(legume_names) else "adds"
        benefits.append(_cap(f"{_join(legume_names)} {verb} nitrogen to the soil, so the next cereal needs less fertiliser."))
    if any(len(s) > 1 for s in rotation["seasons"]):
        benefits.append("Intercropping gives two harvests from one field, so one crop failing does not mean losing everything.")
    if len({c["family"] for c in crops}) > 1:
        benefits.append("Changing crop families breaks pest and disease cycles that build up when one crop is grown every year.")
    hardy = [c["name"] for c in crops if c["droughtTolerance"] >= 4]
    if hardy and profile["falseOnsetRate"] >= 0.15:
        benefits.append(_cap(f"{_join(hardy)} can survive the dry spells that often follow the first rains here."))
    if any(c["fodderValue"] >= 4 for c in crops):
        benefits.append("Leaves and stalks make good animal feed, an extra source of value for mixed farms.")

    for c in crops:
        if water_fit(c, profile) < 60:
            risks.append(_cap(f"{_join([c['name']])} may not get enough water in a dry year here."))
        if season_fit(c, profile) < 60:
            risks.append(f"The season can be too short for slower {_join([c['name']]).lower()} varieties. Choose early-maturing seed.")
    if rotation["seasons"][0] == rotation["seasons"][1]:
        risks.append("Growing the same crop every year drains the same nutrients and lets pests build up.")
    if "groundnut" in crop_ids:
        risks.append("Groundnut must be dried and stored well to avoid aflatoxin, which can make the crop unsellable.")
    if "soybean" in crop_ids:
        risks.append("Soya beans may need inoculant on land where they have not been grown before.")
    if "sesame" in crop_ids:
        risks.append("Beniseed prices depend on export buyers, so check local demand before switching.")
    if any(len(s) > 1 for s in rotation["seasons"]):
        risks.append("Intercropping needs careful spacing and a bit more labour at weeding time.")

    why = rotation["description"]
    if rotation_id != current_id:
        reasons = []
        hardy_names = [c["name"] for c in crops if c["droughtTolerance"] >= 4]
        if profile["falseOnsetRate"] >= 0.15 and hardy_names:
            reasons.append(f"{_join(hardy_names)} cope{'s' if not _plural(hardy_names) else ''} better with the dry spells that follow the first rains here")
        legumes = [c["name"] for c in crops if c["fixesNitrogen"]]
        if legumes:
            reasons.append(f"{_join(legumes)} feed{'' if _plural(legumes) else 's'} the soil with nitrogen")
        cash = [c["name"] for c in crops if c["marketValue"] >= 5]
        if cash:
            reasons.append(f"{_join(cash)} sell{'' if _plural(cash) else 's'} well")
        if reasons:
            why = (reasons[0][0].upper() + reasons[0][1:] + (", " + ", ".join(reasons[1:-1]) if len(reasons) > 2 else "")
                   + (" and " + reasons[-1] if len(reasons) > 1 else "") + ".")

    return {
        "why": why,
        "evidence": evidence,
        "benefits": benefits,
        "risks": risks,
        "gaps": [
            "Based on one NASA data point per state (about 50 km), not your exact field.",
            "Your soil has not been tested. Soil type and fertility change the best choice.",
            "Crop values are typical ranges. Your seed variety and market prices may differ.",
        ],
        "checkLocally": "Talk to your local extension officer or ADP office about the best seed varieties before switching.",
    }


# ---------- main entry ----------

def recommend(state_id: str, current_id: str, priority: str = "balanced") -> dict:
    if state_id not in STATES_BY_ID:
        raise KeyError(f"Unknown state {state_id}")
    if current_id not in ROTATIONS:
        raise KeyError(f"Unknown rotation {current_id}")
    if priority not in PRIORITIES:
        raise KeyError(f"Unknown priority {priority}")

    state = STATES_BY_ID[state_id]
    profile = climate_profile(state_id)

    ranked = sorted(
        (
            score_rotation(r, profile, priority)
            for r, rot in ROTATIONS.items()
            # only suggest real rotations, never "same crop every year"
            if r != current_id and rot["seasons"][0] != rot["seasons"][1]
        ),
        key=lambda x: x["overall"],
        reverse=True,
    )
    current = score_rotation(current_id, profile, priority)
    picks = [current] + ranked[:2]

    options = []
    for item in picks:
        rot = ROTATIONS[item["id"]]
        options.append({
            **item,
            "name": rot["name"],
            "seasons": [[CROPS[c]["name"] for c in s] for s in rot["seasons"]],
            "isCurrent": item["id"] == current_id,
            **explain(item["id"], profile, state["name"], current_id),
        })

    best = max(options, key=lambda o: o["overall"])
    return {
        "state": state,
        "priority": {"id": priority, "label": PRIORITIES[priority]["label"]},
        "options": options,
        "recommendedId": best["id"],
        "planting": {
            "riskLevel": profile["riskLevel"],
            "safePlantingFrom": profile["safePlantingFrom"],
            "safePlantingBy": profile["safePlantingBy"],
            "advice": (
                "Prepare your land and inputs early, but wait for the rains to settle before planting."
                if profile["riskLevel"] != "low"
                else "Rains here are usually reliable once they start."
            ),
        },
        "disclaimer": "Shuka helps you explore options. It does not replace your own judgement or advice from local agricultural experts.",
    }
