import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt_handler import create_jwt

client = TestClient(app)

def test_dashboard_unauthorized():
    # No Authorization header should return 401 Unauthorized
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 401

def test_dashboard_admin_metrics():
    token = create_jwt(user_id="admin-id", email="admin@nexora.com", role="admin", full_name="Admin User")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/dashboard/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "business"
    assert "total_revenue" in data["metrics"]
    assert "total_transactions" in data["metrics"]
    assert "average_deal_size" in data["metrics"]
    assert "active_products" in data["metrics"]
    assert "regional_sales" in data["metrics"]
    assert "recent_sales" in data["metrics"]
    assert "categories" in data["metrics"]

def test_dashboard_admin_notifications():
    token = create_jwt(user_id="admin-id", email="admin@nexora.com", role="admin", full_name="Admin User")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/dashboard/notifications", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "notifications" in data
    assert isinstance(data["notifications"], list)
    for n in data["notifications"]:
        assert "id" in n
        assert "title" in n
        assert "message" in n
        assert "type" in n
        assert "timestamp" in n

def test_dashboard_support_metrics():
    token = create_jwt(user_id="support-id", email="support@nexora.com", role="support", full_name="Support User")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/dashboard/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "system"
    assert "services" in data["metrics"]
    assert "performance" in data["metrics"]
    assert "documents" in data["metrics"]
    assert "users" in data["metrics"]
    
    # Check services keys
    assert "redis" in data["metrics"]["services"]
    assert "qdrant" in data["metrics"]["services"]
    assert "supabase" in data["metrics"]["services"]
    
    # Check performance keys
    assert "cpu" in data["metrics"]["performance"]
    assert "memory" in data["metrics"]["performance"]
    assert "threads" in data["metrics"]["performance"]

def test_dashboard_sales_metrics():
    # Use a dummy UUID
    token = create_jwt(user_id="adf8e4d5-d48d-49cd-a1ff-0b4e439e6ed3", email="sales@nexora.com", role="sales", full_name="Sales User")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/dashboard/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "business"
    assert "total_revenue" in data["metrics"]
    assert "total_transactions" in data["metrics"]
    assert "average_deal_size" in data["metrics"]
