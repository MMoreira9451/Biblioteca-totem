from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, Integer, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import db
from app.models.base import TimestampMixin


class LoanStatus(str, Enum):
    """Loan status enum."""
    ACTIVE = "ACTIVE"
    RETURNED = "RETURNED"
    OVERDUE = "OVERDUE"
    EXTENDED = "EXTENDED"


class Loan(db.Model, TimestampMixin):
    """Loan model for book lending tracking."""
    
    __tablename__ = "loans"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"), nullable=False)
    
    # Loan timestamps
    loan_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    return_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Loan details
    status: Mapped[LoanStatus] = mapped_column(
        SQLEnum(LoanStatus), 
        default=LoanStatus.ACTIVE, 
        nullable=False
    )
    extensions_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Administrative fields
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    returned_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="loans",
        foreign_keys=[user_id]
    )
    book: Mapped["Book"] = relationship(
        "Book", 
        back_populates="loans"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[created_by]
    )
    returner: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[returned_by]
    )
    
    def __repr__(self) -> str:
        return f"<Loan {self.user.email} - {self.book.title}>"
    
    @property
    def is_overdue(self) -> bool:
        """Check if loan is overdue."""
        if self.status == LoanStatus.RETURNED:
            return False
        return datetime.utcnow() > self.due_date
    
    @property
    def days_remaining(self) -> int:
        """Get number of days remaining until due date."""
        if self.status == LoanStatus.RETURNED:
            return 0
        delta = self.due_date - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def days_overdue(self) -> int:
        """Get number of days overdue."""
        if not self.is_overdue:
            return 0
        delta = datetime.utcnow() - self.due_date
        return delta.days
    
    @property
    def can_extend(self) -> bool:
        """Check if loan can be extended."""
        from app.config import get_config
        config = get_config()
        
        return (
            self.status == LoanStatus.ACTIVE and
            self.extensions_count < config.MAX_EXTENSIONS and
            not self.is_overdue
        )
    
    def extend_loan(self, days: Optional[int] = None) -> bool:
        """Extend the loan by specified days."""
        if not self.can_extend:
            return False
        
        from app.config import get_config
        config = get_config()
        
        extension_days = days or config.EXTENSION_DAYS
        self.due_date += timedelta(days=extension_days)
        self.extensions_count += 1
        self.status = LoanStatus.EXTENDED
        
        return True
    
    def return_book(self, returned_by_id: Optional[int] = None) -> None:
        """Mark book as returned."""
        self.status = LoanStatus.RETURNED
        self.return_date = datetime.utcnow()
        if returned_by_id:
            self.returned_by = returned_by_id
        
        # Update book status
        from app.models.book import BookStatus
        self.book.status = BookStatus.AVAILABLE
    
    def to_dict(self) -> dict:
        """Convert loan to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "book_id": self.book_id,
            "loan_date": self.loan_date.isoformat(),
            "due_date": self.due_date.isoformat(),
            "return_date": self.return_date.isoformat() if self.return_date else None,
            "status": self.status.value,
            "extensions_count": self.extensions_count,
            "notes": self.notes,
            "is_overdue": self.is_overdue,
            "days_remaining": self.days_remaining,
            "days_overdue": self.days_overdue,
            "can_extend": self.can_extend,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # Related objects
            "user": self.user.to_dict() if self.user else None,
            "book": self.book.to_dict() if self.book else None
        }