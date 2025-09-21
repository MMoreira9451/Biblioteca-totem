from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.db.session import db


class Base(DeclarativeBase):
    """Base model class with common fields."""
    pass


class TimestampMixin:
    """Mixin for adding timestamp fields."""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )