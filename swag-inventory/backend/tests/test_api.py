"""Run: pytest -q   (uses a temporary SQLite DB)"""
import os
import tempfile

tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{tmp}/test.db"
os.environ["UPLOAD_DIR"] = f"{tmp}/uploads"
os.environ["ADMIN_EMAIL"] = "admin@swag.sa"
os.environ["ADMIN_PASSWORD"] = "admin123"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def login(c, email, pw):
    r = c.post("/api/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_full_flow():
    with TestClient(app) as c:
        assert c.post("/api/auth/login", json={"email": "admin@swag.sa", "password": "bad"}).status_code == 401
        A = login(c, "ADMIN@swag.sa", "admin123")
        branches = c.get("/api/branches", headers=A).json()
        assert len(branches) == 4
        b1, b2 = branches[0]["id"], branches[1]["id"]
        assert any(x["kind"] == "status" for x in c.get("/api/choices", headers=A).json())

        # admin creates an editor for b1 and a viewer for b2
        r = c.post("/api/users", headers=A, json={"email": "ed@swag.sa", "name": "Ed", "password": "secret1",
                                                  "role": "editor", "branch_ids": [b1]})
        assert r.status_code == 201, r.text
        r = c.post("/api/users", headers=A, json={"email": "vi@swag.sa", "name": "Vi", "password": "secret1",
                                                  "role": "viewer", "branch_ids": [b2]})
        assert r.status_code == 201
        assert c.post("/api/users", headers=A, json={"email": "ed@swag.sa", "name": "x", "password": "secret1"}).status_code == 409
        E, V = login(c, "ed@swag.sa", "secret1"), login(c, "vi@swag.sa", "secret1")

        # non-admins can't manage users
        assert c.get("/api/users", headers=E).status_code == 403
        assert c.post("/api/users", headers=V, json={"email": "z@z.z", "name": "z", "password": "secret1",
                                                     "role": "admin"}).status_code == 403

        # editor adds to own branch, not other
        r = c.post("/api/assets", headers=E, json={"name": "Cashier PC", "branch_id": b1, "category": "كمبيوتر", "qty": 2})
        assert r.status_code == 201, r.text
        aid = r.json()["id"]
        assert c.post("/api/assets", headers=E, json={"name": "x", "branch_id": b2, "category": "x"}).status_code == 403
        # viewer can't add / can't see b1 asset
        assert c.post("/api/assets", headers=V, json={"name": "x", "branch_id": b2, "category": "x"}).status_code == 403
        assert c.get(f"/api/assets/{aid}", headers=V).status_code == 404
        assert c.get("/api/assets", headers=V).json() == []
        assert len(c.get("/api/assets", headers=A).json()) == 1

        # update + history
        r = c.patch(f"/api/assets/{aid}", headers=E, json={"status": "يحتاج صيانة", "qty": 3})
        assert r.status_code == 200 and r.json()["qty"] == 3
        hist = c.get(f"/api/assets/{aid}/history", headers=E).json()
        assert hist[0]["action"] == "updated" and "Qty" in hist[0]["details"]

        # photo upload
        png = (b"\x89PNG\r\n\x1a\n" + b"0" * 50)
        r = c.post(f"/api/assets/{aid}/photo", headers=E, files={"file": ("p.png", png, "image/png")})
        assert r.status_code == 200 and r.json()["photo_url"].startswith("/uploads/")
        assert c.get(r.json()["photo_url"]).status_code == 200
        assert c.post(f"/api/assets/{aid}/photo", headers=E,
                      files={"file": ("p.txt", b"x", "text/plain")}).status_code == 400

        # transfer request: editor (b1) requests into b2? not allowed (not his branch)
        assert c.post("/api/requests", headers=E, json={"asset_id": aid, "to_branch_id": b2}).status_code == 403
        # give editor both branches, then request
        eid = [u for u in c.get("/api/users", headers=A).json() if u["email"] == "ed@swag.sa"][0]["id"]
        c.patch(f"/api/users/{eid}", headers=A, json={"branch_ids": [b1, b2]})
        r = c.post("/api/requests", headers=E, json={"asset_id": aid, "to_branch_id": b2, "note": "need it"})
        assert r.status_code == 201, r.text
        rid = r.json()["id"]
        assert c.post("/api/requests", headers=E, json={"asset_id": aid, "to_branch_id": b2}).status_code == 409
        # viewer of b2 sees the incoming request but cannot approve
        assert any(x["id"] == rid for x in c.get("/api/requests", headers=V).json())
        assert c.post(f"/api/requests/{rid}/approve", headers=V).status_code == 403
        r = c.post(f"/api/requests/{rid}/approve", headers=E)
        assert r.status_code == 200 and r.json()["status"] == "Completed"
        assert c.get(f"/api/assets/{aid}", headers=A).json()["branch_id"] == b2
        # viewer now sees it (it's in b2)
        assert len(c.get("/api/assets", headers=V).json()) == 1

        # admin safety
        me = c.get("/api/auth/me", headers=A).json()
        assert c.patch(f"/api/users/{me['id']}", headers=A, json={"role": "viewer"}).status_code == 400
        assert c.delete(f"/api/users/{me['id']}", headers=A).status_code == 400

        # disabled user loses access immediately
        vid = [u for u in c.get("/api/users", headers=A).json() if u["email"] == "vi@swag.sa"][0]["id"]
        c.patch(f"/api/users/{vid}", headers=A, json={"is_active": False})
        assert c.get("/api/assets", headers=V).status_code == 401

        # change password
        assert c.post("/api/auth/change-password", headers=E, json={"current": "wrong", "new": "newpass1"}).status_code == 400
        assert c.post("/api/auth/change-password", headers=E, json={"current": "secret1", "new": "newpass1"}).status_code == 204
        login(c, "ed@swag.sa", "newpass1")

        # import (admin) creates missing branches
        r = c.post("/api/assets/import", headers=A, json={"rows": [
            {"name": "Chair", "branch": "لاروش - جدة", "category": "كراسي", "qty": 4, "purchase_date": "1 Oct 2026"},
            {"name": "", "branch": "x"}]})
        assert r.json() == {"created": 1, "new_branches": 1, "skipped": 1}
        assert c.post("/api/assets/import", headers=E, json={"rows": []}).status_code == 403

        # branch with assets can't be deleted; delete asset works
        assert c.delete(f"/api/branches/{b2}", headers=A).status_code == 400
        assert c.delete(f"/api/assets/{aid}", headers=A).status_code == 204
