"""Pydantic request/response schemas."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

SUPPORTED_LANGUAGES = {"en", "es", "fr", "de", "ar"}


class ContactRequest(BaseModel):
    """Body for POST /api/contact."""

    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(..., min_length=2, max_length=120)
    message: str = Field(..., min_length=10, max_length=5000)
    language: str = Field("en", max_length=8)

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Jane Doe",
                "email": "jane@example.com",
                "subject": "Quote request",
                "message": "Hello, I'd like a quote for a 5-page website.",
                "language": "en",
            }]
        }
    }


class MessageResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    subject: str
    message: str
    language: str
    created_at: datetime

    model_config = {"from_attributes": True}
