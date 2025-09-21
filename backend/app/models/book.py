from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Enum as SQLEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import db
from app.models.base import TimestampMixin


class BookStatus(str, Enum):
    """Book status enum."""
    AVAILABLE = "AVAILABLE"
    LOANED = "LOANED"
    RESERVED = "RESERVED"
    MAINTENANCE = "MAINTENANCE"


class Book(db.Model, TimestampMixin):
    """Book model for library catalog."""
    
    __tablename__ = "books"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    isbn: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True)
    barcode: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[Optional[str]] = mapped_column(String(255))
    publication_year: Mapped[Optional[int]] = mapped_column(Integer)
    edition: Mapped[Optional[str]] = mapped_column(String(50))
    pages: Mapped[Optional[int]] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String(10), default="es", nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    location: Mapped[Optional[str]] = mapped_column(String(100))  # Shelf location
    status: Mapped[BookStatus] = mapped_column(
        SQLEnum(BookStatus), 
        default=BookStatus.AVAILABLE, 
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    loans: Mapped[List["Loan"]] = relationship(
        "Loan", 
        back_populates="book", 
        lazy="dynamic"
    )
    
    def __repr__(self) -> str:
        return f"<Book {self.title} - {self.barcode}>"
    
    @property
    def is_available(self) -> bool:
        """Check if book is available for loan."""
        return self.status == BookStatus.AVAILABLE and self.is_active
    
    @property
    def is_loaned(self) -> bool:
        """Check if book is currently loaned."""
        return self.status == BookStatus.LOANED
    
    @property
    def current_loan(self) -> Optional["Loan"]:
        """Get current active loan for this book."""
        from app.models.loan import LoanStatus
        return self.loans.filter_by(
            status=LoanStatus.ACTIVE
        ).first()
    
    def to_dict(self) -> dict:
        """Convert book to dictionary."""
        return {
            "id": self.id,
            "isbn": self.isbn,
            "barcode": self.barcode,
            "title": self.title,
            "author": self.author,
            "publisher": self.publisher,
            "publication_year": self.publication_year,
            "edition": self.edition,
            "pages": self.pages,
            "language": self.language,
            "subject": self.subject,
            "description": self.description,
            "location": self.location,
            "status": self.status.value,
            "is_active": self.is_active,
            "is_available": self.is_available,
            "is_loaned": self.is_loaned,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }