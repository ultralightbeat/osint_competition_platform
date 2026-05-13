def _register(client, username, email, password="password123"):
    return client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )


def _login(client, username, password="password123"):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def test_first_registered_user_becomes_admin(client):
    assert _register(client, "admin_user", "admin@test.local").status_code == 201
    assert _register(client, "user2", "user2@test.local").status_code == 201

    admin_login = _login(client, "admin_user")
    user_login = _login(client, "user2")
    assert admin_login.status_code == 200
    assert user_login.status_code == 200

    admin_token = admin_login.json["access_token"]
    user_token = user_login.json["access_token"]

    admin_me = client.get("/api/users/me", headers={"Authorization": f"Bearer {admin_token}"})
    user_me = client.get("/api/users/me", headers={"Authorization": f"Bearer {user_token}"})

    assert admin_me.status_code == 200
    assert user_me.status_code == 200
    assert admin_me.json["is_admin"] is True
    assert user_me.json["is_admin"] is False


def test_admin_dashboard_requires_admin_rights(client):
    assert _register(client, "admin_user", "admin@test.local").status_code == 201
    assert _register(client, "regular_user", "regular@test.local").status_code == 201

    admin_token = _login(client, "admin_user").json["access_token"]
    regular_token = _login(client, "regular_user").json["access_token"]

    forbidden = client.get("/api/users/admin/dashboard", headers={"Authorization": f"Bearer {regular_token}"})
    assert forbidden.status_code == 403

    allowed = client.get("/api/users/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert allowed.status_code == 200
    assert "stats" in allowed.json
    assert "users" in allowed.json


def test_admin_can_set_creator_role(client):
    assert _register(client, "admin_user", "admin@test.local").status_code == 201
    assert _register(client, "regular_user", "regular@test.local").status_code == 201

    admin_token = _login(client, "admin_user").json["access_token"]
    regular_login = _login(client, "regular_user")
    regular_token = regular_login.json["access_token"]
    regular_me = client.get("/api/users/me", headers={"Authorization": f"Bearer {regular_token}"})
    regular_id = regular_me.json["id"]

    forbidden = client.put(
        f"/api/users/admin/users/{regular_id}/creator",
        headers={"Authorization": f"Bearer {regular_token}"},
        json={"is_creator": True},
    )
    assert forbidden.status_code == 403

    set_creator = client.put(
        f"/api/users/admin/users/{regular_id}/creator",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_creator": True},
    )
    assert set_creator.status_code == 200
    assert set_creator.json["is_creator"] is True

    unset_creator = client.put(
        f"/api/users/admin/users/{regular_id}/creator",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_creator": False},
    )
    assert unset_creator.status_code == 200
    assert unset_creator.json["is_creator"] is False
