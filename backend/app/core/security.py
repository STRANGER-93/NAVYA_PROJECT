from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import uuid4
import jwt
from fastapi import HTTPException, status
from pwdlib import PasswordHash
from app.core.config import get_settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str: return password_hash.hash(password)
def verify_password(password: str, value: str) -> bool: return password_hash.verify(password, value)
def hash_token(token: str) -> str: return sha256(token.encode()).hexdigest()

def create_access_token(user_id: str) -> str:
    settings = get_settings()
    return jwt.encode({"sub": user_id, "type": "access", "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)}, settings.jwt_secret, algorithm="HS256")

def create_refresh_token() -> tuple[str, str, datetime]:
    settings = get_settings(); raw = uuid4().hex + uuid4().hex
    return raw, hash_token(raw), datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)

def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        if payload.get("type") != "access" or not payload.get("sub"): raise ValueError
        return str(payload["sub"])
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
