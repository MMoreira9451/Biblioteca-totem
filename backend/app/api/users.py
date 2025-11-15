from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from app.db.session import db
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.deps import (
    require_auth, 
    require_admin,
    validate_json_request
)

bp = Blueprint("users", __name__)


@bp.route("/", methods=["GET"])
@require_admin
def list_users():
    """List all users (admin only)."""
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 50, type=int), 1000)
    search = request.args.get("search", "").strip()
    role = request.args.get("role")
    is_active = request.args.get("is_active")
    
    query = db.session.query(User)
    
    # Search filter
    if search:
        search_filter = or_(
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.student_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Role filter
    if role:
        try:
            user_role = UserRole(role.upper())
            query = query.filter(User.role == user_role)
        except ValueError:
            return jsonify({
                "error": "Invalid role",
                "message": f"Invalid role: {role}"
            }), 400
    
    # Active status filter
    if is_active is not None:
        is_active_bool = is_active.lower() in ['true', '1', 'yes']
        query = query.filter(User.is_active == is_active_bool)
    
    # Order by name
    query = query.order_by(User.last_name.asc(), User.first_name.asc())
    
    try:
        if per_page > 100:
            # For large requests, return all without pagination
            users = query.all()
            return jsonify({
                "users": [user.to_dict() for user in users],
                "total": len(users)
            })
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        users = [user.to_dict() for user in pagination.items]
        
        return jsonify({
            "users": users,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": pagination.total,
                "pages": pagination.pages,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error listing users: {str(e)}")
        return jsonify({
            "error": "Query failed",
            "message": "An error occurred while fetching users"
        }), 500


@bp.route("/<int:user_id>", methods=["GET"])
@require_admin
def get_user(user_id: int):
    """Get user details by ID (admin only)."""
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({
            "error": "User not found",
            "message": "User not found"
        }), 404
    
    return jsonify({
        "user": user.to_dict()
    })


@bp.route("/<int:user_id>", methods=["PUT"])
@require_admin
@validate_json_request()
def update_user(user_id: int):
    """Update user information (admin only)."""
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({
            "error": "User not found",
            "message": "User not found"
        }), 404
    
    data = g.request_data
    
    # Update fields if provided
    updatable_fields = [
        "first_name", "last_name", "email", "student_id"
    ]
    
    for field in updatable_fields:
        if field in data:
            setattr(user, field, data[field])
    
    # Handle role change
    if "role" in data:
        try:
            new_role = UserRole(data["role"].upper())
            user.role = new_role
        except ValueError:
            return jsonify({
                "error": "Invalid role",
                "message": f"Invalid role: {data['role']}"
            }), 400
    
    # Handle active status change
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    
    try:
        db.session.commit()
        
        current_app.logger.info(f"User updated: {user.email}")
        
        return jsonify({
            "message": "User updated successfully",
            "user": user.to_dict()
        })
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "Update failed",
            "message": "A user with this email or student ID already exists"
        }), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user: {str(e)}")
        return jsonify({
            "error": "Update failed",
            "message": "An error occurred while updating the user"
        }), 500


@bp.route("/<int:user_id>", methods=["DELETE"])
@require_admin
def deactivate_user(user_id: int):
    """Deactivate a user (admin only)."""
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({
            "error": "User not found",
            "message": "User not found"
        }), 404
    
    # Check if user has active loans
    from app.models.loan import Loan, LoanStatus
    active_loans = db.session.query(Loan).filter(
        Loan.user_id == user_id,
        Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.EXTENDED, LoanStatus.OVERDUE])
    ).count()
    
    if active_loans > 0:
        return jsonify({
            "error": "Cannot deactivate user",
            "message": f"User has {active_loans} active loans. Please return all books first."
        }), 400
    
    try:
        user.is_active = False
        db.session.commit()
        
        current_app.logger.info(f"User deactivated: {user.email}")
        
        return jsonify({
            "message": "User deactivated successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deactivating user: {str(e)}")
        return jsonify({
            "error": "Deactivation failed",
            "message": "An error occurred while deactivating the user"
        }), 500


@bp.route("/<int:user_id>/activate", methods=["POST"])
@require_admin
def activate_user(user_id: int):
    """Reactivate a user (admin only)."""
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({
            "error": "User not found",
            "message": "User not found"
        }), 404
    
    try:
        user.is_active = True
        db.session.commit()
        
        current_app.logger.info(f"User activated: {user.email}")
        
        return jsonify({
            "message": "User activated successfully",
            "user": user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error activating user: {str(e)}")
        return jsonify({
            "error": "Activation failed",
            "message": "An error occurred while activating the user"
        }), 500


@bp.route("/<int:user_id>/reset-password", methods=["POST"])
@require_admin
@validate_json_request(["new_password"])
def reset_user_password(user_id: int):
    """Reset user password (admin only)."""
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({
            "error": "User not found",
            "message": "User not found"
        }), 404
    
    data = g.request_data
    new_password = data.get("new_password")
    
    if len(new_password) < 6:
        return jsonify({
            "error": "Invalid password",
            "message": "Password must be at least 6 characters long"
        }), 400
    
    try:
        user.password_hash = hash_password(new_password)
        db.session.commit()
        
        current_app.logger.info(f"Password reset for user: {user.email}")
        
        return jsonify({
            "message": "Password reset successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resetting password: {str(e)}")
        return jsonify({
            "error": "Password reset failed",
            "message": "An error occurred while resetting password"
        }), 500


@bp.route("/stats", methods=["GET"])
@require_admin
def get_user_stats():
    """Get user statistics (admin only)."""
    try:
        total_users = db.session.query(User).count()
        active_users = db.session.query(User).filter(User.is_active == True).count()
        students = db.session.query(User).filter(User.role == UserRole.STUDENT).count()
        admins = db.session.query(User).filter(User.role == UserRole.ADMIN).count()
        
        return jsonify({
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "students": students,
            "admins": admins
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting user stats: {str(e)}")
        return jsonify({
            "error": "Query failed",
            "message": "An error occurred while fetching statistics"
        }), 500