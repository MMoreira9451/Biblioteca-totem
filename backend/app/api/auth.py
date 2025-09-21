from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy.exc import IntegrityError

from app.db.session import db
from app.models.user import User, UserRole
from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    refresh_access_token
)
from app.deps import validate_json_request, require_auth, require_admin

bp = Blueprint("auth", __name__)


@bp.route("/login", methods=["POST"])
@validate_json_request(["email", "password"])
def login():
    """Authenticate user and return access token."""
    data = g.request_data
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({
            "error": "Invalid credentials",
            "message": "Email and password are required"
        }), 400
    
    # Find user by email
    user = db.session.query(User).filter(User.email == email).first()
    
    if not user or not verify_password(password, user.password_hash):
        current_app.logger.warning(f"Failed login attempt for email: {email}")
        return jsonify({
            "error": "Invalid credentials",
            "message": "Invalid email or password"
        }), 401
    
    if not user.is_active:
        current_app.logger.warning(f"Login attempt for deactivated account: {email}")
        return jsonify({
            "error": "Account deactivated",
            "message": "Your account has been deactivated"
        }), 401
    
    # Create tokens
    access_token = create_access_token(
        user.id, 
        additional_claims={"role": user.role.value}
    )
    refresh_token = create_refresh_token(user.id)
    
    current_app.logger.info(f"Successful login for user: {email}")
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user.to_dict()
    })


@bp.route("/refresh", methods=["POST"])
@validate_json_request(["refresh_token"])
def refresh():
    """Refresh access token using refresh token."""
    data = g.request_data
    refresh_token = data.get("refresh_token")
    
    new_access_token = refresh_access_token(refresh_token)
    
    if not new_access_token:
        return jsonify({
            "error": "Invalid refresh token",
            "message": "Please login again"
        }), 401
    
    return jsonify({
        "message": "Token refreshed successfully",
        "access_token": new_access_token,
        "token_type": "bearer"
    })


@bp.route("/register", methods=["POST"])
@require_admin
@validate_json_request(["email", "password", "first_name", "last_name"])
def register():
    """Register a new user (admin only)."""
    data = g.request_data
    
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    student_id = data.get("student_id", "").strip() if data.get("student_id") else None
    role = UserRole(data.get("role", UserRole.STUDENT.value))
    
    # Validation
    if not all([email, password, first_name, last_name]):
        return jsonify({
            "error": "Missing required fields",
            "message": "Email, password, first name, and last name are required"
        }), 400
    
    if len(password) < 6:
        return jsonify({
            "error": "Invalid password",
            "message": "Password must be at least 6 characters long"
        }), 400
    
    try:
        # Create new user
        user = User(
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            student_id=student_id,
            role=role
        )
        
        db.session.add(user)
        db.session.commit()
        
        current_app.logger.info(f"New user registered: {email}")
        
        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "User already exists",
            "message": "A user with this email or student ID already exists"
        }), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error registering user: {str(e)}")
        return jsonify({
            "error": "Registration failed",
            "message": "An error occurred during registration"
        }), 500


@bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """Get current authenticated user information."""
    user = g.current_user
    return jsonify({
        "user": user.to_dict()
    })


@bp.route("/change-password", methods=["POST"])
@require_auth
@validate_json_request(["current_password", "new_password"])
def change_password():
    """Change user password."""
    data = g.request_data
    user = g.current_user
    
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not verify_password(current_password, user.password_hash):
        return jsonify({
            "error": "Invalid password",
            "message": "Current password is incorrect"
        }), 400
    
    if len(new_password) < 6:
        return jsonify({
            "error": "Invalid password",
            "message": "New password must be at least 6 characters long"
        }), 400
    
    try:
        user.password_hash = hash_password(new_password)
        db.session.commit()
        
        current_app.logger.info(f"Password changed for user: {user.email}")
        
        return jsonify({
            "message": "Password changed successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error changing password: {str(e)}")
        return jsonify({
            "error": "Password change failed",
            "message": "An error occurred while changing password"
        }), 500


@bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    """Logout user (client should discard tokens)."""
    user = g.current_user
    current_app.logger.info(f"User logged out: {user.email}")
    
    return jsonify({
        "message": "Logout successful"
    })