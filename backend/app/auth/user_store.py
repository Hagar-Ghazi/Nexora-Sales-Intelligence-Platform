import os
import json
import uuid
import bcrypt

# Locate users.json relative to this file (backend/data/users.json)
CUR_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.abspath(os.path.join(CUR_DIR, "..", "..", "data", "users.json"))

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(password_plain: str, password_hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password_plain.encode("utf-8"), password_hashed.encode("utf-8"))
    except Exception:
        return False

def init_user_store():
    # Ensure directory exists
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    
    # Start completely empty as requested
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=4)

# Initialize store on import
init_user_store()

def load_users() -> list[dict]:
    if not os.path.exists(USERS_FILE):
        init_user_store()
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users: list[dict]):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=4)

def get_user_by_email(email: str) -> dict | None:
    users = load_users()
    email_lower = email.lower().strip()
    for user in users:
        if user["email"].lower().strip() == email_lower:
            return user
    return None

def get_user_by_id(user_id: str) -> dict | None:
    users = load_users()
    for user in users:
        if user["user_id"] == user_id:
            return user
    return None

def create_user(email: str, password_plain: str, full_name: str, role: str) -> dict:
    users = load_users()
    email_clean = email.lower().strip()
    
    # Check if user already exists
    for user in users:
        if user["email"].lower().strip() == email_clean:
            raise ValueError("User with this email already exists")
            
    new_user = {
        "user_id": str(uuid.uuid4()),
        "email": email_clean,
        "password_hash": hash_password(password_plain),
        "full_name": full_name,
        "role": role,
        "status": "active"
    }
    users.append(new_user)
    save_users(users)
    return new_user

def update_user(user_id: str, email: str, full_name: str, role: str, password_plain: str | None = None) -> dict:
    users = load_users()
    email_clean = email.lower().strip()
    
    # Check if another user has this email
    for user in users:
        if user["user_id"] != user_id and user["email"].lower().strip() == email_clean:
            raise ValueError("Another user with this email already exists")
            
    found_user = None
    for user in users:
        if user["user_id"] == user_id:
            user["email"] = email_clean
            user["full_name"] = full_name
            user["role"] = role.lower()
            if password_plain:
                user["password_hash"] = hash_password(password_plain)
            found_user = user
            break
            
    if not found_user:
        raise ValueError("User not found")
        
    save_users(users)
    return found_user

def list_users() -> list[dict]:
    # Return users but remove password hash for security
    users = load_users()
    safe_users = []
    for user in users:
        safe_user = dict(user)
        safe_user.pop("password_hash", None)
        safe_users.append(safe_user)
    return safe_users
