"""
Multilingual Contact Form — API
===============================
A small full-stack contact form. The frontend is fully translated into 5
languages (including right-to-left Arabic); this API validates and stores
each submission, and can optionally email it on if SMTP is configured.

- POST /api/contact      validate + store a submission
- GET  /api/messages     list recent submissions (demo "inbox")
- GET  /healthz          health check

Interactive docs at /docs.
"""
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multilingual Contact Form API",
    description="Validates and stores contact-form submissions from a 5-language frontend.",
    version="1.0.0",
    contact={"name": "Stanish Appalo JA"},
)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = ROOT_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def _maybe_send_email(msg: schemas.ContactRequest) -> None:
    """Forward the submission by email IF SMTP env vars are configured.
    Silently skipped (and never blocks the API) when not set up."""
    host = os.getenv("SMTP_HOST")
    to_addr = os.getenv("CONTACT_TO")
    if not host or not to_addr:
        return
    try:
        email = EmailMessage()
        email["Subject"] = f"[Contact] {msg.subject}"
        email["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@example.com"))
        email["To"] = to_addr
        email["Reply-To"] = msg.email
        email.set_content(
            f"Name: {msg.name}\nEmail: {msg.email}\nLanguage: {msg.language}\n\n{msg.message}"
        )
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587"))) as server:
            server.starttls()
            user, pwd = os.getenv("SMTP_USER"), os.getenv("SMTP_PASS")
            if user and pwd:
                server.login(user, pwd)
            server.send_message(email)
    except Exception as exc:  # don't let email problems fail the request
        print(f"[contact] email send skipped/failed: {exc}")


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(ROOT_DIR / "index.html")


@app.get("/healthz", tags=["meta"])
def health():
    return {"status": "ok"}


@app.post("/api/contact", response_model=schemas.MessageResponse, status_code=201, tags=["contact"])
def submit(payload: schemas.ContactRequest, db: Session = Depends(get_db)):
    """Validate and store a contact submission (and optionally email it on)."""
    language = payload.language if payload.language in schemas.SUPPORTED_LANGUAGES else "en"
    record = models.Message(
        name=payload.name.strip(),
        email=str(payload.email),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        language=language,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    _maybe_send_email(payload)
    return record


@app.get("/api/messages", response_model=list[schemas.MessageResponse], tags=["contact"])
def list_messages(limit: int = 20, db: Session = Depends(get_db)):
    """List recent submissions — a simple demo 'inbox'."""
    limit = max(1, min(limit, 100))
    return db.query(models.Message).order_by(models.Message.created_at.desc()).limit(limit).all()
