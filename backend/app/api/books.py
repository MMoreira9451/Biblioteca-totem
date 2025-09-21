from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from app.db.session import db
from app.models.book import Book, BookStatus
from app.deps import (
    require_auth, 
    require_admin, 
    require_student_or_admin,
    validate_json_request
)

bp = Blueprint("books", __name__)


@bp.route("/scan/<barcode>", methods=["GET"])
@require_student_or_admin
def scan_book(barcode: str):
    """Get book information by barcode scan."""
    if not barcode:
        return jsonify({
            "error": "Invalid barcode",
            "message": "Barcode cannot be empty"
        }), 400
    
    book = db.session.query(Book).filter(
        Book.barcode == barcode,
        Book.is_active == True
    ).first()
    
    if not book:
        current_app.logger.warning(f"Book not found for barcode: {barcode}")
        return jsonify({
            "error": "Book not found",
            "message": f"No book found with barcode: {barcode}"
        }), 404
    
    # Include current loan information if book is loaned
    book_data = book.to_dict()
    if book.is_loaned and book.current_loan:
        book_data["current_loan"] = book.current_loan.to_dict()
    
    return jsonify({
        "book": book_data,
        "available_actions": _get_available_actions(book)
    })


@bp.route("/<int:book_id>", methods=["GET"])
@require_student_or_admin
def get_book(book_id: int):
    """Get book details by ID."""
    book = db.session.get(Book, book_id)
    
    if not book or not book.is_active:
        return jsonify({
            "error": "Book not found",
            "message": "Book not found or has been deactivated"
        }), 404
    
    book_data = book.to_dict()
    if book.is_loaned and book.current_loan:
        book_data["current_loan"] = book.current_loan.to_dict()
    
    return jsonify({
        "book": book_data
    })


@bp.route("/", methods=["GET"])
@require_student_or_admin
def list_books():
    """List books with optional filtering and pagination."""
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    search = request.args.get("search", "").strip()
    status = request.args.get("status")
    
    query = db.session.query(Book).filter(Book.is_active == True)
    
    # Search filter
    if search:
        search_filter = or_(
            Book.title.ilike(f"%{search}%"),
            Book.author.ilike(f"%{search}%"),
            Book.isbn.ilike(f"%{search}%"),
            Book.barcode.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Status filter
    if status:
        try:
            book_status = BookStatus(status.upper())
            query = query.filter(Book.status == book_status)
        except ValueError:
            return jsonify({
                "error": "Invalid status",
                "message": f"Invalid status: {status}"
            }), 400
    
    # Pagination
    try:
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        books = [book.to_dict() for book in pagination.items]
        
        return jsonify({
            "books": books,
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
        current_app.logger.error(f"Error listing books: {str(e)}")
        return jsonify({
            "error": "Query failed",
            "message": "An error occurred while fetching books"
        }), 500


@bp.route("/", methods=["POST"])
@require_admin
@validate_json_request(["title", "author", "barcode"])
def create_book():
    """Create a new book (admin only)."""
    data = g.request_data
    
    # Required fields
    title = data.get("title", "").strip()
    author = data.get("author", "").strip()
    barcode = data.get("barcode", "").strip()
    
    # Optional fields
    isbn = data.get("isbn", "").strip() if data.get("isbn") else None
    publisher = data.get("publisher", "").strip() if data.get("publisher") else None
    publication_year = data.get("publication_year")
    edition = data.get("edition", "").strip() if data.get("edition") else None
    pages = data.get("pages")
    language = data.get("language", "es").strip()
    subject = data.get("subject", "").strip() if data.get("subject") else None
    description = data.get("description", "").strip() if data.get("description") else None
    location = data.get("location", "").strip() if data.get("location") else None
    
    # Validation
    if not all([title, author, barcode]):
        return jsonify({
            "error": "Missing required fields",
            "message": "Title, author, and barcode are required"
        }), 400
    
    try:
        book = Book(
            title=title,
            author=author,
            barcode=barcode,
            isbn=isbn,
            publisher=publisher,
            publication_year=publication_year,
            edition=edition,
            pages=pages,
            language=language,
            subject=subject,
            description=description,
            location=location,
            status=BookStatus.AVAILABLE
        )
        
        db.session.add(book)
        db.session.commit()
        
        current_app.logger.info(f"New book created: {title} - {barcode}")
        
        return jsonify({
            "message": "Book created successfully",
            "book": book.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "Book already exists",
            "message": f"A book with barcode {barcode} already exists"
        }), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating book: {str(e)}")
        return jsonify({
            "error": "Book creation failed",
            "message": "An error occurred while creating the book"
        }), 500


@bp.route("/<int:book_id>", methods=["PUT"])
@require_admin
@validate_json_request()
def update_book(book_id: int):
    """Update book information (admin only)."""
    book = db.session.get(Book, book_id)
    
    if not book:
        return jsonify({
            "error": "Book not found",
            "message": "Book not found"
        }), 404
    
    data = g.request_data
    
    # Update fields if provided
    updatable_fields = [
        "title", "author", "isbn", "publisher", "publication_year",
        "edition", "pages", "language", "subject", "description", "location"
    ]
    
    for field in updatable_fields:
        if field in data:
            setattr(book, field, data[field])
    
    # Handle status change
    if "status" in data:
        try:
            new_status = BookStatus(data["status"].upper())
            book.status = new_status
        except ValueError:
            return jsonify({
                "error": "Invalid status",
                "message": f"Invalid status: {data['status']}"
            }), 400
    
    try:
        db.session.commit()
        
        current_app.logger.info(f"Book updated: {book.title} - {book.barcode}")
        
        return jsonify({
            "message": "Book updated successfully",
            "book": book.to_dict()
        })
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "Update failed",
            "message": "A book with this barcode or ISBN already exists"
        }), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating book: {str(e)}")
        return jsonify({
            "error": "Update failed",
            "message": "An error occurred while updating the book"
        }), 500


@bp.route("/<int:book_id>", methods=["DELETE"])
@require_admin
def delete_book(book_id: int):
    """Soft delete a book (admin only)."""
    book = db.session.get(Book, book_id)
    
    if not book:
        return jsonify({
            "error": "Book not found",
            "message": "Book not found"
        }), 404
    
    if book.is_loaned:
        return jsonify({
            "error": "Cannot delete book",
            "message": "Cannot delete a book that is currently loaned"
        }), 400
    
    try:
        book.is_active = False
        book.status = BookStatus.MAINTENANCE
        db.session.commit()
        
        current_app.logger.info(f"Book deactivated: {book.title} - {book.barcode}")
        
        return jsonify({
            "message": "Book deactivated successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deactivating book: {str(e)}")
        return jsonify({
            "error": "Deactivation failed",
            "message": "An error occurred while deactivating the book"
        }), 500


def _get_available_actions(book: Book) -> list[str]:
    """Get list of available actions for a book based on its status."""
    actions = ["info"]  # Always available
    
    if book.status == BookStatus.AVAILABLE:
        actions.append("rent")
    elif book.status == BookStatus.LOANED:
        actions.extend(["return", "extend"])
    
    return actions