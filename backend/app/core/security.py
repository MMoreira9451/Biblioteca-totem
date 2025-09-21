import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from flask import current_app

from app.config import get_config


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(user_id: int, additional_claims: Optional[Dict[str, Any]] = None) -> str:
    """Create a JWT access token."""
    config = get_config()
    
    payload = {
        "user_id": user_id,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=config.JWT_ACCESS_TOKEN_EXPIRES)
    }
    
    if additional_claims:
        payload.update(additional_claims)
    
    return jwt.encode(
        payload,
        config.JWT_SECRET_KEY,
        algorithm=config.JWT_ALGORITHM
    )


def create_refresh_token(user_id: int) -> str:
    """Create a JWT refresh token."""
    config = get_config()
    
    payload = {
        "user_id": user_id,
        "type": "refresh",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=config.JWT_REFRESH_TOKEN_EXPIRES)
    }
    
    return jwt.encode(
        payload,
        config.JWT_SECRET_KEY,
        algorithm=config.JWT_ALGORITHM
    )


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token."""
    try:
        config = get_config()
        payload = jwt.decode(
            token,
            config.JWT_SECRET_KEY,
            algorithms=[config.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        current_app.logger.warning(f"Invalid token: {str(e)}")
        return None


def get_user_from_token(token: str) -> Optional[int]:
    """Get user ID from a valid token."""
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload.get("user_id")
    return None


def refresh_access_token(refresh_token: str) -> Optional[str]:
    """Create a new access token from a valid refresh token."""
    payload = decode_token(refresh_token)
    if payload and payload.get("type") == "refresh":
        user_id = payload.get("user_id")
        if user_id:
            return create_access_token(user_id)
    return None