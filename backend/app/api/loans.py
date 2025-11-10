from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy import and_, or_

from app.db.session import db
from app.models.user import User
from app.models.book import Book, BookStatus
from app.models.loan import Loan, LoanStatus
from app.config import get_config
from app.deps import (
    require_auth, 
    require_admin, 
    require_student_or_admin,
    validate_json_request
)

bp = Blueprint("loans", __name__)


@bp.route("/rent", methods=["POST"])
@require_student_or_admin
@validate_json_request(["book_id"])
def rent_book():
    """Rent a book to the current user or specified user."""
    data = g.request_data
    current_user = g.current_user
    config = get_config()
    
    book_id = data.get("book_id")
    user_id = data.get("user_id", current_user.id)  # Admins can rent for others
    notes = data.get("notes", "").strip() if data.get("notes") else None
    
    # If user_id is different from current user, ensure current user is admin
    if user_id != current_user.id and not current_user.is_admin:
        return jsonify({
            "error": "Insufficient permissions",
            "message": "Only admins can rent books for other users"
        }), 403
    
    # Get book
    book = db.session.get(Book, book_id)
    if not book or not book.is_active:
        return jsonify({
            "error": "Book not found",
            "message": "Book not found or is not available"
        }), 404
    
    # Check if book is available
    if not book.is_available:
        return jsonify({
            "error": "Book not available",
            "message": f"Book is currently {book.status.value.lower()}"
        }), 400
    
    # Get target user
    target_user = db.session.get(User, user_id)
    if not target_user or not target_user.is_active:
        return jsonify({
            "error": "User not found",
            "message": "Target user not found or is not active"
        }), 404
    
    # Check user's current loan count
    active_loans_count = db.session.query(Loan).filter(
        and_(
            Loan.user_id == user_id,
            Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.EXTENDED])
        )
    ).count()
    
    if active_loans_count >= config.MAX_BOOKS_PER_USER:
        return jsonify({
            "error": "Loan limit exceeded",
            "message": f"User has reached the maximum of {config.MAX_BOOKS_PER_USER} active loans"
        }), 400
    
    # Check if user already has this book
    existing_loan = db.session.query(Loan).filter(
        and_(
            Loan.user_id == user_id,
            Loan.book_id == book_id,
            Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.EXTENDED])
        )
    ).first()
    
    if existing_loan:
        return jsonify({
            "error": "Book already loaned",
            "message": "User already has an active loan for this book"
        }), 400
    
    try:
        # Calculate due date
        loan_date = datetime.utcnow()
        due_date = loan_date + timedelta(days=config.DEFAULT_LOAN_DAYS)
        
        # Create loan
        loan = Loan(
            user_id=user_id,
            book_id=book_id,
            loan_date=loan_date,
            due_date=due_date,
            status=LoanStatus.ACTIVE,
            notes=notes,
            created_by=current_user.id
        )
        
        # Update book status
        book.status = BookStatus.LOANED
        
        db.session.add(loan)
        db.session.commit()
        
        current_app.logger.info(
            f"Book rented: {book.title} to {target_user.email} by {current_user.email}"
        )
        
        return jsonify({
            "message": "Book rented successfully",
            "loan": loan.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error renting book: {str(e)}")
        return jsonify({
            "error": "Rental failed",
            "message": "An error occurred while renting the book"
        }), 500


@bp.route("/return", methods=["POST"])
@require_student_or_admin
@validate_json_request(["loan_id"])
def return_book():
    """Return a loaned book."""
    data = g.request_data
    current_user = g.current_user
    
    loan_id = data.get("loan_id")
    notes = data.get("notes", "").strip() if data.get("notes") else None
    
    # Get loan
    loan = db.session.get(Loan, loan_id)
    if not loan:
        return jsonify({
            "error": "Loan not found",
            "message": "Loan not found"
        }), 404
    
    # Check permissions - user can return their own books, admin can return any
    if loan.user_id != current_user.id and not current_user.is_admin:
        return jsonify({
            "error": "Insufficient permissions",
            "message": "You can only return your own books"
        }), 403
    
    # Check if loan is active
    if loan.status not in [LoanStatus.ACTIVE, LoanStatus.EXTENDED, LoanStatus.OVERDUE]:
        return jsonify({
            "error": "Invalid loan status",
            "message": f"Cannot return book with status: {loan.status.value}"
        }), 400
    
    try:
        # Return the book
        loan.return_book(returned_by_id=current_user.id)
        if notes:
            loan.notes = f"{loan.notes}\nReturn notes: {notes}" if loan.notes else f"Return notes: {notes}"
        
        db.session.commit()
        
        current_app.logger.info(
            f"Book returned: {loan.book.title} by {loan.user.email}, processed by {current_user.email}"
        )
        
        return jsonify({
            "message": "Book returned successfully",
            "loan": loan.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error returning book: {str(e)}")
        return jsonify({
            "error": "Return failed",
            "message": "An error occurred while returning the book"
        }), 500


@bp.route("/extend", methods=["POST"])
@require_student_or_admin
@validate_json_request(["loan_id"])
def extend_loan():
    """Extend a loan period."""
    data = g.request_data
    current_user = g.current_user
    
    loan_id = data.get("loan_id")
    extension_days = data.get("extension_days")  # Optional, will use default if not provided
    
    # Get loan
    loan = db.session.get(Loan, loan_id)
    if not loan:
        return jsonify({
            "error": "Loan not found",
            "message": "Loan not found"
        }), 404
    
    # Check permissions - user can extend their own loans, admin can extend any
    if loan.user_id != current_user.id and not current_user.is_admin:
        return jsonify({
            "error": "Insufficient permissions",
            "message": "You can only extend your own loans"
        }), 403
    
    # Check if loan can be extended
    if not loan.can_extend:
        reasons = []
        if loan.status != LoanStatus.ACTIVE:
            reasons.append(f"loan status is {loan.status.value}")
        if loan.is_overdue:
            reasons.append("loan is overdue")
        
        config = get_config()
        if loan.extensions_count >= config.MAX_EXTENSIONS:
            reasons.append(f"maximum extensions ({config.MAX_EXTENSIONS}) reached")
        
        return jsonify({
            "error": "Cannot extend loan",
            "message": f"Cannot extend loan: {', '.join(reasons)}"
        }), 400
    
    try:
        # Extend the loan
        success = loan.extend_loan(days=extension_days)
        
        if not success:
            return jsonify({
                "error": "Extension failed",
                "message": "Unable to extend loan"
            }), 400
        
        db.session.commit()
        
        current_app.logger.info(
            f"Loan extended: {loan.book.title} for {loan.user.email} by {current_user.email}"
        )
        
        return jsonify({
            "message": "Loan extended successfully",
            "loan": loan.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error extending loan: {str(e)}")
        return jsonify({
            "error": "Extension failed",
            "message": "An error occurred while extending the loan"
        }), 500


@bp.route("/active", methods=["GET"])
@require_student_or_admin
def list_active_loans():
    """List active loans for current user (admin can filter by user)."""
    current_user = g.current_user
    user_id = request.args.get("user_id", type=int)
    book_id = request.args.get("book_id", type=int)
    
    query = db.session.query(Loan).filter(
        Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.EXTENDED, LoanStatus.OVERDUE])
    )
    
    if book_id:
        query = query.filter(Loan.book_id == book_id)
    
    if user_id:
        query = query.filter(Loan.user_id == user_id)
    elif not current_user.is_admin:
        query = query.filter(Loan.user_id == current_user.id)
    
    loans = query.order_by(Loan.due_date.asc()).all()
    
    return jsonify({
        "loans": [loan.to_dict() for loan in loans],
        "total": len(loans)
    })


@bp.route("/user/<int:user_id>", methods=["GET"])
@require_student_or_admin
def get_user_loans(user_id: int):
    """Get loans for a specific user."""
    current_user = g.current_user
    
    # Check permissions - user can see their own loans, admin can see any
    if user_id != current_user.id and not current_user.is_admin:
        return jsonify({
            "error": "Insufficient permissions",
            "message": "You can only view your own loans"
        }), 403
    
    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status = request.args.get("status")
    
    query = db.session.query(Loan).filter(Loan.user_id == user_id)
    
    # Status filter
    if status:
        try:
            loan_status = LoanStatus(status.upper())
            query = query.filter(Loan.status == loan_status)
        except ValueError:
            return jsonify({
                "error": "Invalid status",
                "message": f"Invalid status: {status}"
            }), 400
    
    # Order by loan date descending
    query = query.order_by(Loan.loan_date.desc())
    
    try:
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        loans = [loan.to_dict() for loan in pagination.items]
        
        return jsonify({
            "loans": loans,
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
        current_app.logger.error(f"Error fetching user loans: {str(e)}")
        return jsonify({
            "error": "Query failed",
            "message": "An error occurred while fetching loans"
        }), 500


@bp.route("/", methods=["GET"])
@require_admin
def list_all_loans():
    """List all loans (admin only)."""
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status = request.args.get("status")
    user_email = request.args.get("user_email", "").strip()
    book_barcode = request.args.get("book_barcode", "").strip()
    
    query = db.session.query(Loan)
    
    # Status filter
    if status:
        try:
            loan_status = LoanStatus(status.upper())
            query = query.filter(Loan.status == loan_status)
        except ValueError:
            return jsonify({
                "error": "Invalid status",
                "message": f"Invalid status: {status}"
            }), 400
    
    # User email filter
    if user_email:
        query = query.join(User).filter(User.email.ilike(f"%{user_email}%"))
    
    # Book barcode filter
    if book_barcode:
        query = query.join(Book).filter(Book.barcode.ilike(f"%{book_barcode}%"))
    
    # Order by loan date descending
    query = query.order_by(Loan.loan_date.desc())
    
    try:
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        loans = [loan.to_dict() for loan in pagination.items]
        
        return jsonify({
            "loans": loans,
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
        current_app.logger.error(f"Error listing loans: {str(e)}")
        return jsonify({
            "error": "Query failed",
            "message": "An error occurred while fetching loans"
        }), 500


@bp.route("/overdue", methods=["GET"])
@require_admin
def get_overdue_loans():
    """Get all overdue loans (admin only)."""
    current_time = datetime.utcnow()
    
    overdue_loans = db.session.query(Loan).filter(
        and_(
            Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.EXTENDED]),
            Loan.due_date < current_time
        )
    ).order_by(Loan.due_date.asc()).all()
    
    # Update overdue status
    for loan in overdue_loans:
        if loan.status != LoanStatus.OVERDUE:
            loan.status = LoanStatus.OVERDUE
    
    try:
        db.session.commit()
        
        loans_data = [loan.to_dict() for loan in overdue_loans]
        
        return jsonify({
            "overdue_loans": loans_data,
            "total_overdue": len(overdue_loans)
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error fetching overdue loans: {str(e)}")
        return jsonify({
            "error": "Query failed",
            "message": "An error occurred while fetching overdue loans"
        }), 500


@bp.route("/<int:loan_id>", methods=["GET"])
@require_student_or_admin
def get_loan(loan_id: int):
    """Get specific loan details."""
    loan = db.session.get(Loan, loan_id)
    
    if not loan:
        return jsonify({
            "error": "Loan not found",
            "message": "Loan not found"
        }), 404
    
    current_user = g.current_user
    
    # Check permissions - user can see their own loans, admin can see any
    if loan.user_id != current_user.id and not current_user.is_admin:
        return jsonify({
            "error": "Insufficient permissions",
            "message": "You can only view your own loans"
        }), 403
    
    return jsonify({
        "loan": loan.to_dict()
    })
