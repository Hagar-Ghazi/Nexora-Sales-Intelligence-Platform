import pytest
import os
import json
from app.auth import user_store
from app.auth.user_store import hash_password, verify_password, get_user_by_email, list_users, create_user, update_user
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

def test_user_store_operations():
    # Clear current file to start fresh
    if os.path.exists(user_store.USERS_FILE):
        os.remove(user_store.USERS_FILE)
    user_store.init_user_store()
    
    # Verify empty setup
    assert len(list_users()) == 0
    
    # Create user
    created = create_user("test@nexora.com", "Nx_Pass123!", "Test Name", "sales")
    assert created["email"] == "test@nexora.com"
    assert created["role"] == "sales"
    assert created["full_name"] == "Test Name"
    
    # Update user details
    updated = update_user(created["user_id"], "updated@nexora.com", "New Name", "manager", "Nx_NewPass123!")
    assert updated["email"] == "updated@nexora.com"
    assert updated["full_name"] == "New Name"
    assert updated["role"] == "manager"
    
    # Verify verify_password with the new password works
    user_data = get_user_by_email("updated@nexora.com")
    assert verify_password("Nx_NewPass123!", user_data["password_hash"]) is True
