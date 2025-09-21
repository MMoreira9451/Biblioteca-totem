from functools import wraps
from typing import Optional
from flask import request, jsonify, g, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.core.security import get_user_from_token
from app.models.user import User, UserRole
from app.db.session import db


def get_current_user() -> Optional[User]:
    """Get current authenticated user."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    user_id = get_user_from_token(token)
    
    if user_id:
        return db.session.get(User, user_id)
    return None


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                "error": "Authentication required",
                "message": "Please provide a valid access token"
            }), 401
        
        if not user.is_active:
            return jsonify({
                "error": "Account deactivated",
                "message": "Your account has been deactivated"
            }), 401
        
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function


def require_role(required_role: UserRole):
    """Decorator to require specific user role."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            user = g.current_user
            if user.role != required_role:
                return jsonify({
                    "error": "Insufficient permissions",
                    "message": f"This endpoint requires {required_role.value} role"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_admin(f):
    """Decorator to require admin role."""
    return require_role(UserRole.ADMIN)(f)


def require_student_or_admin(f):
    """Decorator to allow both students and admins."""
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        user = g.current_user
        if user.role not in [UserRole.STUDENT, UserRole.ADMIN]:
            return jsonify({
                "error": "Insufficient permissions",
                "message": "This endpoint requires STUDENT or ADMIN role"
            }), 403
        return f(*args, **kwargs)
    return decorated_function


def get_request_user_id() -> Optional[int]:
    """Get user ID from request, either from token or request body."""
    user = get_current_user()
    if user:
        return user.id
    return None


def validate_json_request(required_fields: list = None):
    """Decorator to validate JSON request."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    "error": "Invalid request",
                    "message": "Request must be JSON"
                }), 400
            
            data = request.get_json()
            if not data:
                return jsonify({
                    "error": "Invalid request",
                    "message": "Request body cannot be empty"
                }), 400
            
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        "error": "Missing required fields",
                        "message": f"Required fields: {', '.join(missing_fields)}"
                    }), 400
            
            g.request_data = data
            return f(*args, **kwargs)
        return decorated_function
    return decorator