import pytest
from app.auth.user_store import hash_password, verify_password, get_user_by_email, list_users, create_user
from app.auth.jwt_handler import create_jwt, decode_jwt, extract_user_from_token

def test_password_hashing():
    password = "MyStrongPassword_2026!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_flow():
    user_id = "test-uuid"
    email = "test@nexora.com"
    role = "sales"
    full_name = "Test User"
    
    token = create_jwt(user_id, email, role, full_name)
    assert isinstance(token, str)
    
    # Decode
    payload = decode_jwt(token)
    assert payload["sub"] == user_id
    assert payload["email"] == email
    assert payload["user_metadata"]["role"] == role
    assert payload["user_metadata"]["full_name"] == full_name
    
    # Extract
    context = extract_user_from_token(token)
    assert context.user_id == user_id
    assert context.email == email
    assert context.role == role
    assert context.full_name == full_name

def test_user_store():
    # Preseeded user check
    admin = get_user_by_email("admin@nexora.com")
    assert admin is not None
    assert admin["role"] == "admin"
    assert verify_password("Nx_2026_Sec_Adm!", admin["password_hash"]) is True
    
    # List users
    users = list_users()
    assert len(users) >= 4
    for u in users:
        assert "password_hash" not in u
        assert "email" in u
        assert "role" in u
