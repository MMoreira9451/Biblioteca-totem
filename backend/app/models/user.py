from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Enum as SQLEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import db
from app.models.base import TimestampMixin


class UserRole(str, Enum):
    """User roles enum."""
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class User(db.Model, TimestampMixin):
    """User model for students and administrators."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    student_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole), 
        default=UserRole.STUDENT, 
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    loans: Mapped[List["Loan"]] = relationship(
        "Loan", 
        back_populates="user", 
        lazy="dynamic"
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_student(self) -> bool:
        """Check if user is a student."""
        return self.role == UserRole.STUDENT
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
    
    def to_dict(self) -> dict:
        """Convert user to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "student_id": self.student_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role.value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }