"""SQLAlchemy ORM models."""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from .database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Message(Base):
    """A contact-form submission."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    language = Column(String(8), default="en", nullable=False)  # locale the visitor used
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
