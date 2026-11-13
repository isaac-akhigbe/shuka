"""SQLite database for NASA daily data.

One file, data/shuka.db, holds every day of rain, max temperature and soil
wetness for every state. Moving to Postgres later only changes this file.
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "data" / "shuka.db"


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS daily (
                state_id TEXT NOT NULL,
                day      TEXT NOT NULL,   -- YYYY-MM-DD
                rain     REAL,            -- mm/day (PRECTOTCORR)
                tmax     REAL,            -- °C (T2M_MAX)
                soil     REAL,            -- 0 to 1 (GWETROOT)
                PRIMARY KEY (state_id, day)
            );

            CREATE TABLE IF NOT EXISTS sync_log (
                state_id   TEXT PRIMARY KEY,
                synced_at  TEXT NOT NULL,  -- when we last talked to NASA
                last_day   TEXT            -- newest day we have
            );
            """
        )


def save_days(state_id: str, rows: list[tuple]) -> int:
    """rows = [(day, rain, tmax, soil), ...]. Existing days are overwritten."""
    with connect() as conn:
        conn.executemany(
            "INSERT OR REPLACE INTO daily (state_id, day, rain, tmax, soil) VALUES (?, ?, ?, ?, ?)",
            [(state_id, *r) for r in rows],
        )
    return len(rows)


def get_days(state_id: str) -> list[sqlite3.Row]:
    with connect() as conn:
        return conn.execute(
            "SELECT day, rain, tmax, soil FROM daily WHERE state_id = ? ORDER BY day",
            (state_id,),
        ).fetchall()


def last_day(state_id: str) -> str | None:
    """Newest day that has a rain value."""
    with connect() as conn:
        row = conn.execute(
            "SELECT MAX(day) AS d FROM daily WHERE state_id = ? AND rain IS NOT NULL",
            (state_id,),
        ).fetchone()
    return row["d"] if row else None


def mark_synced(state_id: str) -> None:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO sync_log (state_id, synced_at, last_day) VALUES (?, ?, ?)",
            (state_id, now, last_day(state_id)),
        )


def status() -> dict:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM sync_log ORDER BY state_id").fetchall()
        totals = conn.execute(
            "SELECT COUNT(*) AS n, MAX(day) AS latest FROM daily WHERE rain IS NOT NULL"
        ).fetchone()
    return {
        "totalDays": totals["n"],
        "lastSyncedAt": max((r["synced_at"] for r in rows), default=None),
        "latestDataDay": totals["latest"],
        "states": {r["state_id"]: {"syncedAt": r["synced_at"], "lastDay": r["last_day"]} for r in rows},
    }
