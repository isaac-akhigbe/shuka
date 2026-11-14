"""Officer sign-in.

- Passwords are stored as salted PBKDF2 hashes, never as plain text.
- Signing in gives a random token. The frontend sends it back on every request
  in the header "Authorization: Bearer <token>". Tokens expire after 7 days.
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Header, HTTPException

import db

TOKEN_DAYS = 7
HASH_ROUNDS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), HASH_ROUNDS)
    return f"{salt}${digest.hex()}"


def check_password(password: str, stored: str) -> bool:
    salt, expected = stored.split("$")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), HASH_ROUNDS)
    return hmac.compare_digest(digest.hex(), expected)


def _public(officer) -> dict:
    return {
        "id": officer["id"],
        "username": officer["username"],
        "name": officer["name"],
        "stateId": officer["state_id"],
        "role": officer["role"],
    }


def create_officer(username: str, name: str, password: str, state_id: str | None, role: str = "officer") -> None:
    with db.connect() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO officers (username, name, password_hash, state_id, role) VALUES (?, ?, ?, ?, ?)",
            (username.lower(), name, hash_password(password), state_id, role),
        )


def seed_demo_officer() -> None:
    """Creates the demo Kano officer once. Change the password in .env for anything public."""
    create_officer(
        username=os.getenv("DEMO_OFFICER_USERNAME", "kano.officer"),
        name=os.getenv("DEMO_OFFICER_NAME", "Kano Extension Officer"),
        password=os.getenv("DEMO_OFFICER_PASSWORD", "shuka2026"),
        state_id=os.getenv("DEMO_OFFICER_STATE", "kano"),
    )


def login(username: str, password: str) -> dict:
    with db.connect() as conn:
        officer = conn.execute(
            "SELECT * FROM officers WHERE username = ?", (username.strip().lower(),)
        ).fetchone()
    # Same message for wrong username or wrong password, so nobody can probe usernames
    if not officer or not check_password(password, officer["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong username or password")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO sessions (token, officer_id, expires_at) VALUES (?, ?, ?)",
            (token, officer["id"], expires.isoformat()),
        )
    return {"token": token, "officer": _public(officer)}


def logout(token: str) -> None:
    with db.connect() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


def _token_from(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Please sign in")
    return authorization.removeprefix("Bearer ").strip()


def current_officer(authorization: str | None = Header(default=None)) -> dict:
    """FastAPI dependency. Add `officer = Depends(current_officer)` to protect an endpoint."""
    token = _token_from(authorization)
    with db.connect() as conn:
        row = conn.execute(
            """SELECT o.*, s.expires_at FROM sessions s
               JOIN officers o ON o.id = s.officer_id
               WHERE s.token = ?""",
            (token,),
        ).fetchone()
    if not row or datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again")
    return {**_public(row), "token": token}


def require_state_access(officer: dict, state_id: str) -> None:
    """Officers can only work in their own state. Admins can work anywhere."""
    if officer["role"] != "admin" and officer["stateId"] != state_id:
        raise HTTPException(status_code=403, detail="You can only manage farmers in your own state")
