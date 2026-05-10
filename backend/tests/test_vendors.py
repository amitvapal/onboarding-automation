from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import get_db
from app.main import app
from app.models import Base


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(
        bind=engine, autocommit=False, autoflush=False, future=True
    )

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def _create_vendor(client: TestClient, **overrides) -> dict:
    payload = {
        "legal_name": "Acme Corp",
        "ein": "12-3456789",
        "address": "1 Main St",
        "payment_terms": "net30",
        "bank_account_last4": "1234",
        **overrides,
    }
    r = client.post("/api/vendors", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


def test_create_vendor_starts_pending(client):
    v = _create_vendor(client)
    assert v["status"] == "pending"
    assert v["legal_name"] == "Acme Corp"
    assert v["approved_at"] is None
    assert v["approved_by"] is None


def test_list_filters_by_status(client):
    _create_vendor(client, legal_name="Pending Co")
    approved = _create_vendor(client, legal_name="Approved Co")
    client.post(f"/api/vendors/{approved['id']}/approve", json={"actor": "alice"})

    r = client.get("/api/vendors", params={"status": "pending"})
    assert r.status_code == 200
    names = [v["legal_name"] for v in r.json()]
    assert "Pending Co" in names
    assert "Approved Co" not in names


def test_patch_writes_audit_with_before_and_after(client):
    v = _create_vendor(client)
    vid = v["id"]

    r = client.patch(
        f"/api/vendors/{vid}",
        json={"address": "2 Main St", "actor": "alice"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["address"] == "2 Main St"

    r = client.get(f"/api/vendors/{vid}/history")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["action"] == "updated"
    assert row["actor"] == "alice"
    assert row["before_json"]["address"] == "1 Main St"
    assert row["after_json"]["address"] == "2 Main St"
    # untouched fields should match across before/after
    assert row["before_json"]["legal_name"] == row["after_json"]["legal_name"]
    assert row["before_json"]["ein"] == row["after_json"]["ein"]


def test_approve_sets_status_and_writes_audit(client):
    v = _create_vendor(client)
    vid = v["id"]

    r = client.post(f"/api/vendors/{vid}/approve", json={"actor": "alice"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "approved"
    assert body["approved_by"] == "alice"
    assert body["approved_at"] is not None

    r = client.get(f"/api/vendors/{vid}/history")
    rows = r.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["action"] == "approved"
    assert row["actor"] == "alice"
    assert row["before_json"]["status"] == "pending"
    assert row["before_json"]["approved_by"] is None
    assert row["after_json"]["status"] == "approved"
    assert row["after_json"]["approved_by"] == "alice"


def test_reject_with_reason(client):
    v = _create_vendor(client)
    vid = v["id"]

    r = client.post(
        f"/api/vendors/{vid}/reject",
        json={"actor": "alice", "reason": "EIN does not match IRS records"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "rejected"

    r = client.get(f"/api/vendors/{vid}/history")
    rows = r.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["action"] == "rejected"
    assert row["actor"] == "alice"
    assert row["before_json"]["status"] == "pending"
    assert row["after_json"]["status"] == "rejected"
    assert row["after_json"]["reason"] == "EIN does not match IRS records"


def test_history_returns_newest_first(client):
    v = _create_vendor(client)
    vid = v["id"]

    r = client.patch(
        f"/api/vendors/{vid}",
        json={"address": "2 Main St", "actor": "alice"},
    )
    assert r.status_code == 200, r.text

    # Cheap insurance against same-microsecond timestamps from a fast TestClient.
    time.sleep(0.01)

    r = client.post(f"/api/vendors/{vid}/approve", json={"actor": "bob"})
    assert r.status_code == 200, r.text

    rows = client.get(f"/api/vendors/{vid}/history").json()
    assert [row["action"] for row in rows] == ["approved", "updated"]
    assert rows[0]["actor"] == "bob"
    assert rows[1]["actor"] == "alice"


def test_approve_already_approved_is_409(client):
    v = _create_vendor(client)
    vid = v["id"]
    client.post(f"/api/vendors/{vid}/approve", json={"actor": "alice"})

    r = client.post(f"/api/vendors/{vid}/approve", json={"actor": "alice"})
    assert r.status_code == 409


def test_history_for_unknown_vendor_is_404(client):
    r = client.get("/api/vendors/00000000-0000-0000-0000-000000000000/history")
    assert r.status_code == 404
