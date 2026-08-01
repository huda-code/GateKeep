import secrets
from fastapi import Depends, Header, HTTPException
from app.config import settings

DEMO_USER = {"email": settings.demo_admin_email, "name": "GateKeep Demo Admin", "role": "admin"}

def authenticate(email: str, password: str) -> bool:
    return secrets.compare_digest(email.lower(), settings.demo_admin_email.lower()) and secrets.compare_digest(password, settings.demo_admin_password)

def require_admin(authorization: str | None = Header(default=None)) -> dict:
    expected = f"Bearer {settings.demo_auth_token}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing Bearer token")
    return DEMO_USER
