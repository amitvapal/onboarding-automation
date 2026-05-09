from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app import claude_client
from app.claude_client import ExtractionError, extract_fields

VALID_W9 = {
    "legal_name": "Acme Corp",
    "business_name": "Acme",
    "ein": "12-3456789",
    "address": "1 Main St, Springfield, IL",
    "tax_classification": "C Corporation",
}

INVALID_W9 = {**VALID_W9, "ein": "BADFORMAT"}  # fails the XX-XXXXXXX regex


def _text_response(payload: dict):
    text = f"```json\n{json.dumps(payload)}\n```"
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def _tool_use_response(payload: dict, name: str = "record_w9_fields"):
    return SimpleNamespace(
        content=[SimpleNamespace(type="tool_use", name=name, input=payload)]
    )


def _install_fake_client(monkeypatch, fake_client) -> None:
    monkeypatch.setattr(claude_client, "_get_client", lambda: fake_client)


def test_v1_returns_validated_w9(monkeypatch):
    fake = MagicMock()
    fake.messages.create.return_value = _text_response(VALID_W9)
    _install_fake_client(monkeypatch, fake)

    result = extract_fields(b"%PDF-1.4 fake", "w9", prompt_version="v1")

    assert result["ein"] == "12-3456789"
    assert result["legal_name"] == "Acme Corp"
    assert fake.messages.create.call_count == 1
    # v1/v2 must NOT pass tools
    _, kwargs = fake.messages.create.call_args
    assert "tools" not in kwargs


def test_v2_returns_validated_w9(monkeypatch):
    fake = MagicMock()
    fake.messages.create.return_value = _text_response(VALID_W9)
    _install_fake_client(monkeypatch, fake)

    result = extract_fields(b"%PDF-1.4 fake", "w9", prompt_version="v2")

    assert result["ein"] == "12-3456789"
    assert fake.messages.create.call_count == 1


def test_v3_returns_validated_w9(monkeypatch):
    fake = MagicMock()
    fake.messages.create.return_value = _tool_use_response(VALID_W9)
    _install_fake_client(monkeypatch, fake)

    result = extract_fields(b"%PDF-1.4 fake", "w9", prompt_version="v3")

    assert result["ein"] == "12-3456789"
    assert fake.messages.create.call_count == 1
    # v3 must pass tools and force tool_choice
    _, kwargs = fake.messages.create.call_args
    assert kwargs["tools"][0]["name"] == "record_w9_fields"
    assert kwargs["tool_choice"] == {"type": "tool", "name": "record_w9_fields"}
    assert "ein" in kwargs["tools"][0]["input_schema"]["properties"]


def test_v3_retries_once_on_validation_error_and_succeeds(monkeypatch):
    fake = MagicMock()
    fake.messages.create.side_effect = [
        _tool_use_response(INVALID_W9),
        _tool_use_response(VALID_W9),
    ]
    _install_fake_client(monkeypatch, fake)

    result = extract_fields(b"%PDF-1.4 fake", "w9", prompt_version="v3")

    assert result["ein"] == "12-3456789"
    assert fake.messages.create.call_count == 2


def test_v3_raises_extraction_error_after_two_failures(monkeypatch):
    fake = MagicMock()
    fake.messages.create.return_value = _tool_use_response(INVALID_W9)
    _install_fake_client(monkeypatch, fake)

    with pytest.raises(ExtractionError):
        extract_fields(b"%PDF-1.4 fake", "w9", prompt_version="v3")

    assert fake.messages.create.call_count == 2


def test_unknown_doc_type_raises(monkeypatch):
    fake = MagicMock()
    _install_fake_client(monkeypatch, fake)

    with pytest.raises(ExtractionError):
        extract_fields(b"%PDF-1.4 fake", "1099", prompt_version="v3")

    assert fake.messages.create.call_count == 0


def test_unknown_prompt_version_raises(monkeypatch):
    fake = MagicMock()
    _install_fake_client(monkeypatch, fake)

    with pytest.raises(ExtractionError):
        extract_fields(b"%PDF-1.4 fake", "w9", prompt_version="v99")

    assert fake.messages.create.call_count == 0
