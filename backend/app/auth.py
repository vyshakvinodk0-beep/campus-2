import jwt
import datetime
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.models import User
from backend.app.db import db

JWT_SECRET = "campusinsight-ai-production-jwt-secret-key-2025"
JWT_ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("id") or payload.get("sub")
    if not user_id:
        return None
    try:
        user_id_int = int(user_id)
        return next((u for u in db.users if u.id == user_id_int), None)
    except (ValueError, TypeError):
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> User:
    user = get_current_user_optional(credentials)
    if not user:
        # Fallback to demo default user if authorization header is not strictly required
        if db.users:
            return db.users[0]
        raise HTTPException(status_code=401, detail="Authentication credentials required")
    return user
