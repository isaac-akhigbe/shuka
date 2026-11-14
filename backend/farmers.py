"""Farmer registry: add one farmer, import many from CSV, list, delete."""

import csv
import io
import re
from datetime import datetime, timezone

import db

LANGUAGES = ["Hausa", "Fulfulde", "Kanuri", "English", "Yoruba", "Nupe", "Tiv"]
MAX_CSV_ROWS = 5000


def normalise_phone(raw: str) -> str | None:
    """Turns 0803 123 4567, 2348031234567 or +234 803 123 4567 into +2348031234567.
    Returns None if it isn't a valid Nigerian mobile number."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("234"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 10 and digits[0] in "789":
        return "+234" + digits
    return None


def _row(r) -> dict:
    return {
        "id": r["id"],
        "name": r["name"],
        "phone": r["phone"],
        "stateId": r["state_id"],
        "lga": r["lga"],
        "language": r["language"],
        "crops": r["crops"],
        "createdAt": r["created_at"],
    }


def add_farmer(data: dict, state_id: str, officer_id: int) -> dict:
    """Validates and saves one farmer. Raises ValueError with a plain-English reason."""
    name = (data.get("name") or "").strip()
    if not name:
        raise ValueError("Name is missing")
    phone = normalise_phone(data.get("phone", ""))
    if not phone:
        raise ValueError(f"'{data.get('phone', '')}' is not a valid Nigerian mobile number")
    language = (data.get("language") or "Hausa").strip().title()
    if language not in LANGUAGES:
        raise ValueError(f"Language must be one of {', '.join(LANGUAGES)}")
    if not data.get("consent", True):
        raise ValueError("The farmer must agree to receive calls")

    with db.connect() as conn:
        if conn.execute("SELECT 1 FROM farmers WHERE phone = ?", (phone,)).fetchone():
            raise ValueError(f"{phone} is already registered")
        cur = conn.execute(
            """INSERT INTO farmers (name, phone, state_id, lga, language, crops, consent, added_by, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)""",
            (
                name[:100],
                phone,
                state_id,
                (data.get("lga") or "").strip()[:60] or None,
                language,
                (data.get("crops") or "").strip()[:120] or None,
                officer_id,
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
            ),
        )
        row = conn.execute("SELECT * FROM farmers WHERE id = ?", (cur.lastrowid,)).fetchone()
    return _row(row)


def import_csv(text: str, state_id: str, officer_id: int) -> dict:
    """Columns: name, phone, lga, language, crops (header row required).
    Good rows are saved, bad rows are reported with the line number and reason."""
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")))  # strip Excel's hidden BOM
    if not reader.fieldnames:
        raise ValueError("The file is empty")
    headers = {h.strip().lower() for h in reader.fieldnames if h}
    missing = {"name", "phone"} - headers
    if missing:
        raise ValueError(f"Missing column(s): {', '.join(sorted(missing))}")

    added, errors = 0, []
    for line_no, raw in enumerate(reader, start=2):  # line 1 is the header
        if line_no - 1 > MAX_CSV_ROWS:
            errors.append({"line": line_no, "reason": f"Stopped after {MAX_CSV_ROWS} rows"})
            break
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}
        if not any(row.values()):
            continue  # skip blank lines
        try:
            add_farmer(row, state_id, officer_id)
            added += 1
        except ValueError as err:
            errors.append({"line": line_no, "reason": str(err)})
    return {"added": added, "skipped": len(errors), "errors": errors[:50]}


def list_farmers(state_id: str | None) -> list[dict]:
    with db.connect() as conn:
        if state_id:
            rows = conn.execute(
                "SELECT * FROM farmers WHERE state_id = ? ORDER BY id DESC", (state_id,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM farmers ORDER BY id DESC").fetchall()
    return [_row(r) for r in rows]


def get_farmer(farmer_id: int) -> dict | None:
    with db.connect() as conn:
        r = conn.execute("SELECT * FROM farmers WHERE id = ?", (farmer_id,)).fetchone()
    return _row(r) if r else None


def delete_farmer(farmer_id: int) -> None:
    with db.connect() as conn:
        conn.execute("DELETE FROM farmers WHERE id = ?", (farmer_id,))


def counts_by_state() -> dict:
    with db.connect() as conn:
        rows = conn.execute("SELECT state_id, COUNT(*) AS n FROM farmers GROUP BY state_id").fetchall()
    return {r["state_id"]: r["n"] for r in rows}
