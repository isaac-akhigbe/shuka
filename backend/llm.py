"""Talks to an AI model. Gemini by default (free tier).

Settings in .env:
    LLM_PROVIDER=gemini          # only gemini is wired up for now
    GEMINI_API_KEY=...
    GEMINI_MODEL=gemini-2.5-flash
"""

import json
import os

from pydantic import BaseModel


class LLMUnavailable(Exception):
    """No key, no internet, quota used up, or the model returned nonsense."""


def generate_structured(system: str, prompt: str, schema: type[BaseModel]) -> BaseModel:
    """Ask the model for JSON that matches `schema`, and return it as that Pydantic model."""
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    if provider != "gemini":
        raise LLMUnavailable(f"LLM_PROVIDER '{provider}' is not set up yet")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMUnavailable("GEMINI_API_KEY is not set in .env")

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.3,  # low = sticks closely to the facts we give it
            ),
        )
    except Exception as err:
        raise LLMUnavailable(f"Gemini request failed: {err}") from err

    if isinstance(response.parsed, schema):
        return response.parsed
    try:
        return schema.model_validate(json.loads(response.text or ""))
    except Exception as err:
        raise LLMUnavailable(f"Gemini returned an answer in the wrong shape: {err}") from err
