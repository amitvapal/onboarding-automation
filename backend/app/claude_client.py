from __future__ import annotations

import base64
import json
import re
from typing import Any

from pydantic import BaseModel, ValidationError

from .prompts import v1, v2, v3
from .schemas import InvoiceFields, MSAFields, W9Fields

MODEL = "claude-sonnet-4-5"
MAX_TOKENS = 4096

_SCHEMAS: dict[str, type[BaseModel]] = {
    "w9": W9Fields,
    "msa": MSAFields,
    "invoice": InvoiceFields,
}

_TOOL_NAMES = {
    "w9": "record_w9_fields",
    "msa": "record_msa_fields",
    "invoice": "record_invoice_fields",
}

_PROMPT_MODULES = {"v1": v1, "v2": v2, "v3": v3}


class ExtractionError(Exception):
    pass


def _get_client():
    import anthropic

    return anthropic.Anthropic()


def extract_fields(
    pdf_bytes: bytes, doc_type: str, prompt_version: str = "v3"
) -> dict:
    if doc_type not in _SCHEMAS:
        raise ExtractionError(f"Unknown doc_type: {doc_type!r}")
    if prompt_version not in _PROMPT_MODULES:
        raise ExtractionError(f"Unknown prompt_version: {prompt_version!r}")

    schema_cls = _SCHEMAS[doc_type]
    prompt = _get_prompt(prompt_version, doc_type)
    messages = _build_messages(pdf_bytes, prompt)
    client = _get_client()

    last_err: Exception | None = None
    for _ in range(2):
        try:
            raw = _call_claude(client, messages, schema_cls, prompt_version, doc_type)
            return schema_cls.model_validate(raw).model_dump(mode="json")
        except (ValidationError, ExtractionError) as e:
            last_err = e

    raise ExtractionError(
        f"Extraction failed after retry for doc_type={doc_type} "
        f"prompt_version={prompt_version}: {last_err}"
    ) from last_err


def _get_prompt(version: str, doc_type: str) -> str:
    prompts = _PROMPT_MODULES[version].PROMPTS
    if doc_type not in prompts:
        raise ExtractionError(
            f"No prompt for doc_type {doc_type!r} at version {version}"
        )
    return prompts[doc_type]


def _build_messages(pdf_bytes: bytes, prompt: str) -> list[dict[str, Any]]:
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("ascii")
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_b64,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }
    ]


def _call_claude(
    client: Any,
    messages: list[dict[str, Any]],
    schema_cls: type[BaseModel],
    prompt_version: str,
    doc_type: str,
) -> dict:
    if prompt_version == "v3":
        tool_name = _TOOL_NAMES[doc_type]
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=messages,
            tools=[
                {
                    "name": tool_name,
                    "description": f"Record extracted {doc_type.upper()} fields.",
                    "input_schema": schema_cls.model_json_schema(),
                }
            ],
            tool_choice={"type": "tool", "name": tool_name},
        )
        for block in response.content:
            if getattr(block, "type", None) == "tool_use":
                return dict(block.input)
        raise ExtractionError("Response contained no tool_use block")

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=messages,
    )
    text_parts = [
        block.text
        for block in response.content
        if getattr(block, "type", None) == "text"
    ]
    if not text_parts:
        raise ExtractionError("Response contained no text block")
    return _parse_json(" ".join(text_parts))


def _parse_json(text: str) -> dict:
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else None
    if candidate is None:
        bare = re.search(r"\{.*\}", text, re.DOTALL)
        candidate = bare.group(0) if bare else None
    if candidate is None:
        raise ExtractionError("No JSON object found in response text")
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as e:
        raise ExtractionError(f"Invalid JSON in response: {e}") from e
    if not isinstance(parsed, dict):
        raise ExtractionError("Top-level JSON must be an object")
    return parsed
