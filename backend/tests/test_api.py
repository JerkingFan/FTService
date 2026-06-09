"""Smoke-тесты API — запуск: pytest tests/ -q"""

import io

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def buyer_token():
    r = client.post(
        "/api/auth/login",
        json={"email": "buyer@test.kg", "password": "buyer123"},
    )
    assert r.status_code == 200
    return r.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_config():
    r = client.get("/api/config")
    assert r.status_code == 200
    assert r.json()["brand"] == "FTservice"
    assert "max_upload_files" in r.json()


def test_categories_count():
    r = client.get("/api/parts/categories")
    assert r.status_code == 200
    assert len(r.json()) == 9


def test_parts_paginated():
    r = client.get("/api/parts", params={"page": 1, "limit": 5})
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5
    if data["items"]:
        assert "images" in data["items"][0]


def test_parts_detail():
    r = client.get("/api/parts", params={"limit": 1})
    part_id = r.json()["items"][0]["id"]
    rid = client.get(f"/api/parts/{part_id}")
    assert rid.status_code == 200
    assert len(rid.json()["images"]) >= 1


def test_masters_paginated():
    r = client.get("/api/masters", params={"page": 1, "limit": 3})
    assert r.status_code == 200
    assert len(r.json()["items"]) <= 3


def test_masters_nearby():
    r = client.get("/api/masters/nearby", params={"lat": 42.87, "lng": 74.59, "radius_km": 20})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_submission_anonymous():
    r = client.post(
        "/api/parts/submissions",
        json={
            "contact_name": "Тест",
            "contact_phone": "+996700000099",
            "title": "Тестовая деталь pytest",
            "price": 1000,
            "condition": "used",
            "category": "electrical",
            "car": "Test",
            "location": "Бишкек",
        },
    )
    assert r.status_code == 201


def test_cabinet_requires_auth(buyer_token):
    assert client.get("/api/bookings/cabinet").status_code == 401
    r = client.get("/api/bookings/cabinet", headers=auth(buyer_token))
    assert r.status_code == 200
    assert "bookings" in r.json()


@pytest.fixture(scope="module")
def master_token():
    r = client.post(
        "/api/auth/login",
        json={"email": "master@test.kg", "password": "master123"},
    )
    if r.status_code != 200:
        pytest.skip("master@test.kg not in DB — пересоздайте сид")
    return r.json()["access_token"]


def test_master_cabinet_requires_master(buyer_token, master_token):
    assert client.get("/api/bookings/master", headers=auth(buyer_token)).status_code == 403
    r = client.get("/api/bookings/master", headers=auth(master_token))
    assert r.status_code == 200
    data = r.json()
    assert "profile" in data
    assert "bookings" in data
    assert "pending_count" in data


def test_master_cannot_book_self(buyer_token, master_token):
    masters = client.get("/api/masters", params={"limit": 50}).json()["items"]
    me = client.get("/api/auth/me", headers=auth(master_token)).json()
    own_id = me.get("master_id")
    if not own_id:
        pytest.skip("master profile not linked")
    r = client.post(
        "/api/bookings",
        headers=auth(master_token),
        json={
            "master_id": own_id,
            "service": "diagnostic",
            "booking_date": "2026-12-01",
            "booking_time": "10:00:00",
            "phone": "+996555000000",
        },
    )
    assert r.status_code == 400


def test_master_updates_booking_status(master_token):
    r = client.get("/api/bookings/master", headers=auth(master_token))
    pending = [b for b in r.json()["bookings"] if b["status"] == "pending"]
    if not pending:
        pytest.skip("no pending bookings")
    bid = pending[0]["id"]
    upd = client.patch(
        f"/api/bookings/{bid}/status",
        headers=auth(master_token),
        json={"status": "confirmed"},
    )
    assert upd.status_code == 200
    assert upd.json()["status"] == "confirmed"


def test_favorites_flow(buyer_token):
    parts = client.get("/api/parts", params={"limit": 1}).json()["items"]
    pid = parts[0]["id"]
    h = auth(buyer_token)
    r1 = client.post(f"/api/me/favorites/parts/{pid}", headers=h)
    assert r1.status_code == 200
    assert r1.json()["active"] is True
    lib = client.get("/api/me/library", headers=h)
    assert pid in lib.json()["favorite_part_ids"]
    r2 = client.post(f"/api/me/favorites/parts/{pid}", headers=h)
    assert r2.json()["active"] is False


def test_viewed_and_search(buyer_token):
    h = auth(buyer_token)
    pid = client.get("/api/parts", params={"limit": 1}).json()["items"][0]["id"]
    assert client.post(f"/api/me/viewed/parts/{pid}", headers=h).status_code == 200
    s = client.post(
        "/api/me/saved-searches",
        headers=h,
        json={"label": "pytest-search", "q": "toyota"},
    )
    assert s.status_code == 201
    assert client.delete(f"/api/me/saved-searches/{s.json()['id']}", headers=h).status_code == 200


def test_upload_requires_auth():
    png = io.BytesIO(
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    )
    r = client.post(
        "/api/uploads/images",
        files=[("files", ("t.png", png, "image/png"))],
    )
    assert r.status_code == 401


def test_upload_with_auth(buyer_token):
    png = io.BytesIO(
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
        b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    r = client.post(
        "/api/uploads/images",
        headers=auth(buyer_token),
        files=[("files", ("t.png", png, "image/png"))],
    )
    assert r.status_code == 200
    assert len(r.json()["urls"]) == 1
    assert "/api/media/" in r.json()["urls"][0]


def test_seller_dashboard(buyer_token):
    seller = client.post(
        "/api/auth/login",
        json={"email": "seller@test.kg", "password": "seller123"},
    )
    assert seller.status_code == 200
    r = client.get("/api/seller/dashboard", headers=auth(seller.json()["access_token"]))
    assert r.status_code == 200
    assert "submissions" in r.json()
