"""Farmer briefings: the context a future AI call agent will use to talk with farmers.

How it stays trustworthy:
1. FACTS come only from Shuka's own engine (NASA data + crop table). Never from the AI.
2. The AI only turns those facts into plain language and likely questions and answers.
3. A check flags any number in the AI's text that is not in our facts.
4. An extension officer reviews, edits and approves it before an agent may use it.
5. No farmer names or phone numbers are ever sent to the AI.
"""

import json
import re
from datetime import datetime, timezone

from pydantic import BaseModel, Field

import db
import llm
from climate import climate_profile
from engine import recommend
from states import STATES_BY_ID

LANGUAGES = ["English", "Hausa"]

# Topics the agent must never answer itself. Fixed by us, not written by the AI.
HAND_OVER_TOPICS = [
    "Fertiliser types, amounts or timing",
    "Pesticides, herbicides or any chemical doses",
    "Crop or animal disease diagnosis",
    "Seed, input or market prices",
    "Loans, subsidies or government programmes",
    "Anything about a specific farm that is not in this briefing",
]


# ---------- what the AI must return ----------

class QA(BaseModel):
    question: str = Field(description="A question a farmer is likely to ask, in simple words")
    answer: str = Field(description="Answer using ONLY the facts provided. 1 to 3 short sentences.")


class AlternativeNote(BaseModel):
    name: str
    whenToChoose: str = Field(description="One sentence on when a farmer might prefer this option")


class BriefingText(BaseModel):
    officerSummary: str = Field(description="3 to 4 sentences in English for the extension officer")
    keyMessage: str = Field(description="What the agent says first on every call. Max 2 sentences. Farmer language.")
    plantingAdvice: str = Field(description="When to plant and why, 2 to 3 sentences. Farmer language.")
    recommendationExplained: str = Field(description="The recommended rotation and why it fits, 2 to 4 sentences. Farmer language.")
    alternatives: list[AlternativeNote]
    warnings: list[str] = Field(description="Short practical warnings from the risks. Farmer language.")
    faq: list[QA] = Field(description="6 to 8 likely farmer questions with answers. Farmer language.")


# ---------- facts from our engine ----------

def build_facts(state_id: str, current: str, priority: str) -> dict:
    """Everything the AI is allowed to say, taken from Shuka's own calculations."""
    rec = recommend(state_id, current, priority)
    p = climate_profile(state_id)
    t = p["trend"]
    best = next(o for o in rec["options"] if o["id"] == rec["recommendedId"])
    current_opt = next(o for o in rec["options"] if o["isCurrent"])

    return {
        "state": STATES_BY_ID[state_id]["name"],
        "dataSource": f"NASA POWER daily data, {p['firstYear']} to {p['lastYear']}",
        "climate": {
            "falseStarts": f"{p['falseOnsetYears']} of {p['yearsAnalysed']} seasons",
            "falseStartTrend": f"{round(t['falseOnsetRateEarly'] * 100)}% of seasons up to {t['splitYear']}, "
                               f"{round(t['falseOnsetRateLate'] * 100)}% since",
            "safePlantingFrom": p["safePlantingFrom"],
            "safePlantingBy": p["safePlantingBy"],
            "seasonLengthDays": p["seasonLengthMedian"],
            "seasonLengthDryYearDays": p["seasonLengthDryYear"],
            "rainAprToOctMm": p["seasonalRainMean"],
            "rainDryYearMm": p["seasonalRainDryYear"],
            "veryHotDaysPerSeason": p["heatDaysMean"],
            "riskLevel": p["riskLevel"],
        },
        "currentPractice": {
            "name": current_opt["name"],
            "score": current_opt["overall"],
            "risks": current_opt["risks"],
        },
        "recommended": {
            "name": best["name"],
            "isSameAsCurrent": best["isCurrent"],
            "score": best["overall"],
            "seasons": best["seasons"],
            "why": best["why"],
            "benefits": best["benefits"],
            "risks": best["risks"],
            "evidence": best["evidence"],
        },
        "alternatives": [
            {"name": o["name"], "score": o["overall"], "why": o["why"], "risks": o["risks"]}
            for o in rec["options"]
            if o["id"] != best["id"]
        ],
        "plantingAdvice": rec["planting"]["advice"],
        "priority": rec["priority"]["label"],
        "dataDay": db.status()["latestDataDay"],
    }


# ---------- prompts ----------

SYSTEM = """You write farmer briefings for Shuka, an agricultural advisory service in northern Nigeria.
An AI phone agent will use your briefing to talk with smallholder farmers, many with little formal schooling.

Strict rules:
- Use ONLY the facts in the FACTS block. Never add numbers, dates, crop names, prices or claims that are not there.
- Do not give fertiliser, pesticide, disease or price advice. Say "ask your extension officer" instead.
- Use everyday Nigerian crop names exactly as given (guinea corn, beans, millet, beniseed, groundnut, maize, soya beans).
- Short, warm, plain sentences. No jargon. Say "dry spell after the first rains" instead of "false onset".
- If the recommended rotation is the same as current practice, say the current practice already suits the area.
- In the FAQ, include "What if I already planted?" and "Can I still grow maize?" and one about trusting the advice.
- Every FAQ answer that goes beyond the facts must tell the farmer to ask their extension officer."""


def _prompt(facts: dict, language: str) -> str:
    lang_rule = (
        "Write officerSummary in English. Write every other field in Hausa, using simple everyday Hausa "
        "as spoken in Kano. Keep crop names recognisable."
        if language == "Hausa"
        else "Write every field in simple English."
    )
    return f"{lang_rule}\n\nFACTS:\n{json.dumps(facts, indent=2)}"


# ---------- fallback when the AI isn't available ----------

def _fallback(facts: dict) -> BriefingText:
    """Plain template briefing in English, built only from facts. Used if Gemini fails."""
    c, r = facts["climate"], facts["recommended"]
    rec_line = (
        f"Keep {r['name'].lower()}. It already suits {facts['state']} better than the alternatives."
        if r["isSameAsCurrent"]
        else f"This season, think about {r['name'].lower()}. {r['why']}"
    )
    return BriefingText(
        officerSummary=(
            f"In {facts['state']}, the first rains were followed by a long dry spell in {c['falseStarts']} "
            f"({c['falseStartTrend']}). Safe planting usually starts from {c['safePlantingFrom']}. "
            f"Recommended: {r['name']} (score {r['score']}). Current practice {facts['currentPractice']['name']} "
            f"scores {facts['currentPractice']['score']}."
        ),
        keyMessage=f"This is Shuka for farmers in {facts['state']}. Prepare your land, but wait to plant until about {c['safePlantingFrom']}.",
        plantingAdvice=(
            f"In many years here, the first rains stop for more than a week. It is usually safe to plant from "
            f"{c['safePlantingFrom']}, and in most years by {c['safePlantingBy']}. {facts['plantingAdvice']}"
        ),
        recommendationExplained=rec_line,
        alternatives=[
            {"name": a["name"], "whenToChoose": a["why"]} for a in facts["alternatives"]
        ],
        warnings=r["risks"][:4],
        faq=[
            QA(question="What if I already planted?",
               answer="Watch your field closely. If the seedlings die in a dry spell, ask your extension officer about replanting with early-maturing seed."),
            QA(question="Can I still grow maize?",
               answer="Maize needs steady rain. Look at the advice for your area, and ask your extension officer about early-maturing maize seed."),
            QA(question="Why should I trust this advice?",
               answer=f"It comes from NASA satellite weather records for {facts['state']} from {facts['dataSource'].split(', ')[-1]}, checked by your extension officer."),
            QA(question="When should I plant?",
               answer=f"Usually from {c['safePlantingFrom']}, and in most years by {c['safePlantingBy']}."),
        ],
    )


# ---------- number check ----------

def _numbers(text: str) -> set[str]:
    return set(re.findall(r"\d+(?:\.\d+)?", text))


def unverified_numbers(text: BriefingText, facts: dict) -> list[str]:
    """Numbers the AI wrote that do not appear anywhere in our facts. Shown to the officer."""
    allowed = _numbers(json.dumps(facts))
    written = _numbers(text.model_dump_json())
    return sorted(written - allowed, key=lambda x: float(x))


# Words that suggest the AI strayed into topics the agent must hand over
RISKY_WORDS = {
    "fertiliser": "fertiliser", "fertilizer": "fertiliser", "urea": "fertiliser", "npk": "fertiliser",
    "pesticide": "pesticides", "herbicide": "pesticides", "insecticide": "pesticides", "spray": "pesticides",
    "price": "prices", "naira": "prices", "₦": "prices", "loan": "loans", "subsidy": "subsidies",
    "disease": "disease", "kg": "doses", "litre": "doses", "dose": "doses",
}


def risky_topics(content: dict) -> list[str]:
    """Off-limits topics mentioned in the farmer text, for the officer to check."""
    text = json.dumps({k: v for k, v in content.items() if k != "officerSummary"}).lower()
    found = {topic for word, topic in RISKY_WORDS.items() if re.search(rf"(?<![a-z]){re.escape(word)}", text)}
    return sorted(found)


# ---------- storage ----------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _row(r) -> dict:
    latest_day = db.status()["latestDataDay"]
    return {
        "id": r["id"],
        "stateId": r["state_id"],
        "current": r["current_rotation"],
        "priority": r["priority"],
        "language": r["language"],
        "status": r["status"],
        "source": r["source"],
        "content": json.loads(r["content"]),
        "facts": json.loads(r["facts"]),
        "unverifiedNumbers": json.loads(r["unverified"]),
        "riskyTopics": risky_topics(json.loads(r["content"])),
        "handOverTopics": HAND_OVER_TOPICS,
        "createdAt": r["created_at"],
        "createdBy": r["created_by_name"],
        "approvedAt": r["approved_at"],
        "approvedBy": r["approved_by_name"],
        # Needs a fresh look if newer NASA data has arrived since it was written
        "needsReview": bool(latest_day and r["data_day"] and latest_day > r["data_day"]),
    }


_SELECT = """SELECT b.*, c.name AS created_by_name, a.name AS approved_by_name
             FROM briefings b
             LEFT JOIN officers c ON c.id = b.created_by
             LEFT JOIN officers a ON a.id = b.approved_by"""


def generate(state_id: str, current: str, priority: str, language: str, officer_id: int) -> dict:
    facts = build_facts(state_id, current, priority)
    try:
        text = llm.generate_structured(SYSTEM, _prompt(facts, language), BriefingText)
        source = "ai"
    except llm.LLMUnavailable as err:
        print(f"AI briefing unavailable, using template: {err}")
        text = _fallback(facts)
        source = "template"
        language = "English"

    with db.connect() as conn:
        cur = conn.execute(
            """INSERT INTO briefings (state_id, current_rotation, priority, language, status, source,
                                      content, facts, unverified, data_day, created_by, created_at)
               VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)""",
            (state_id, current, priority, language, source, text.model_dump_json(), json.dumps(facts),
             json.dumps(unverified_numbers(text, facts)), facts["dataDay"], officer_id, _now()),
        )
        new_id = cur.lastrowid
    return get(new_id)


def get(briefing_id: int) -> dict | None:
    with db.connect() as conn:
        r = conn.execute(f"{_SELECT} WHERE b.id = ?", (briefing_id,)).fetchone()
    return _row(r) if r else None


def update_content(briefing_id: int, content: dict) -> dict:
    """Officer edits. Re-validated and re-checked, and goes back to draft."""
    text = BriefingText.model_validate(content)
    b = get(briefing_id)
    with db.connect() as conn:
        conn.execute(
            "UPDATE briefings SET content = ?, unverified = ?, status = 'draft', approved_by = NULL, approved_at = NULL WHERE id = ?",
            (text.model_dump_json(), json.dumps(unverified_numbers(text, b["facts"])), briefing_id),
        )
    return get(briefing_id)


def approve(briefing_id: int, officer_id: int) -> dict:
    b = get(briefing_id)
    with db.connect() as conn:
        # Only one approved briefing per state and language at a time
        conn.execute(
            "UPDATE briefings SET status = 'archived' WHERE state_id = ? AND language = ? AND status = 'approved'",
            (b["stateId"], b["language"]),
        )
        conn.execute(
            "UPDATE briefings SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?",
            (officer_id, _now(), briefing_id),
        )
    return get(briefing_id)


def latest(state_id: str, approved_only: bool = False) -> dict | None:
    where = "b.state_id = ? AND b.status = 'approved'" if approved_only else "b.state_id = ? AND b.status != 'archived'"
    with db.connect() as conn:
        r = conn.execute(f"{_SELECT} WHERE {where} ORDER BY b.id DESC LIMIT 1", (state_id,)).fetchone()
    return _row(r) if r else None


def agent_context(b: dict) -> dict:
    """Exactly what a future call agent would receive. No farmer personal data."""
    return {
        "role": "You are Shuka, a friendly farming advice line. Speak simply. Use only this briefing.",
        "language": b["language"],
        "state": b["facts"]["state"],
        "openWith": b["content"]["keyMessage"],
        "briefing": b["content"],
        "facts": b["facts"],
        "handOverToExtensionOfficer": b["handOverTopics"],
        "approvedBy": b["approvedBy"],
        "approvedAt": b["approvedAt"],
    }
