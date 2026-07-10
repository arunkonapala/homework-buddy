"""LLM provider abstraction: Claude (preferred) with Groq fallback.

Provider is chosen at call time from environment variables, so the app works
the moment either key lands in .env — no code changes needed.
"""

import json
import os
import re

import requests

ANTHROPIC_MODEL = "claude-opus-4-8"
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

_anthropic_client = None


class LLMError(Exception):
    pass


def active_provider() -> str:
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.getenv("GROQ_API_KEY"):
        return "groq"
    return "none"


def _anthropic():
    global _anthropic_client
    if _anthropic_client is None:
        import anthropic

        _anthropic_client = anthropic.Anthropic()
    return _anthropic_client


def _anthropic_text(response) -> str:
    if response.stop_reason == "refusal":
        raise LLMError("The model declined to answer this request.")
    return "".join(b.text for b in response.content if b.type == "text")


def chat(system: str, messages: list[dict], max_tokens: int = 2048) -> str:
    """Free-form chat. `messages` is a list of {"role", "content"} dicts."""
    provider = active_provider()
    if provider == "anthropic":
        response = _anthropic().messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            system=system,
            messages=messages,
        )
        return _anthropic_text(response)
    if provider == "groq":
        return _groq([{"role": "system", "content": system}, *messages], max_tokens)
    raise LLMError("No LLM provider configured. Set ANTHROPIC_API_KEY or GROQ_API_KEY.")


def generate_json(system: str, prompt: str, schema: dict, max_tokens: int = 8000) -> dict:
    """Generate a response constrained to `schema` (JSON Schema)."""
    provider = active_provider()
    if provider == "anthropic":
        response = _anthropic().messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            system=system,
            messages=[{"role": "user", "content": prompt}],
            output_config={"format": {"type": "json_schema", "schema": schema}},
        )
        return json.loads(_anthropic_text(response))
    if provider == "groq":
        # Groq JSON mode guarantees valid JSON but not the schema, so the
        # schema is restated in the prompt and the result validated loosely.
        schema_prompt = (
            f"{prompt}\n\nRespond ONLY with JSON matching this schema exactly:\n"
            f"{json.dumps(schema)}"
        )
        text = _groq(
            [{"role": "system", "content": system},
             {"role": "user", "content": schema_prompt}],
            max_tokens,
            json_mode=True,
        )
        return _parse_json(text)
    raise LLMError("No LLM provider configured. Set ANTHROPIC_API_KEY or GROQ_API_KEY.")


def _groq(messages: list[dict], max_tokens: int, json_mode: bool = False) -> str:
    # Groq's free tier counts requested max_tokens toward its TPM limit,
    # so cap it well below the 12k/min budget.
    body = {"model": GROQ_MODEL, "messages": messages, "max_tokens": min(max_tokens, 4000)}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    resp = requests.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
        json=body,
        timeout=120,
    )
    if resp.status_code != 200:
        raise LLMError(f"Groq API error {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise LLMError("Model did not return valid JSON.")
