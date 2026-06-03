# Multilingual Contact Form (Full-Stack)

A polished contact form translated into **5 languages — including right-to-left Arabic** —
backed by a small **FastAPI** service that validates and stores every submission (and can
email it on). Vanilla JS frontend, no framework.

> Portfolio sample by **Stanish Appalo JA**. Built to match the "5-page website with a
> multilingual contact form" type of brief, and the contact-form need in almost every web
> project.

## 🌍 Languages

🇬🇧 English · 🇪🇸 Español · 🇫🇷 Français · 🇩🇪 Deutsch · 🇸🇦 العربية (RTL)

Switching language instantly updates **every** string — labels, placeholders, the subject
dropdown, validation messages, and the success screen — and flips the entire layout to
right-to-left for Arabic. The form also auto-selects the visitor's browser language on load.

## ✨ What it demonstrates

- **Real internationalization (i18n)** done cleanly: one translations file, `data-i18n`
  bindings, runtime interpolation (`{name}`), and `dir="rtl"` handling via CSS logical properties.
- **Localized, accessible validation** — error messages appear in the selected language with
  `aria-invalid` flags and focus management.
- **A genuine full-stack flow** — `POST /api/contact` validates (Pydantic + `EmailStr`),
  stores to a database, and optionally forwards by email via SMTP if configured.
- **Same DB story as a real deployment** — SQLite locally with zero setup, auto-switching to
  **Neon/Postgres** when `DATABASE_URL` is set. Includes a Render blueprint.
- **Graceful offline demo** — if the backend isn't running, the UI still demonstrates the
  full multilingual experience.

## 🔌 API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/contact` | Validate + store a submission |
| `GET` | `/api/messages` | List recent submissions (demo inbox) |
| `GET` | `/healthz` | Health check |
| `GET` | `/docs` | Swagger UI |

## 🚀 Run locally

```bash
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# open http://localhost:8000   (Swagger at /docs)
```

No database setup needed — it creates a local `messages.db`.

> **Static-only preview:** you can also open `index.html` directly to try the multilingual
> UI without the backend (submissions just show the success state).

## 📧 Optional email forwarding

Set the `SMTP_*` and `CONTACT_TO` variables (see `.env.example`) and each submission is
emailed on in addition to being stored. Leave them unset to just store submissions.

## 📁 Structure

```
05-multilingual-contact-form/
├── app/
│   ├── __init__.py
│   ├── main.py        # FastAPI app + routes (+ optional SMTP)
│   ├── database.py    # SQLite ↔ Postgres
│   ├── models.py      # Message model
│   └── schemas.py     # Pydantic schemas (EmailStr validation)
├── static/
│   ├── styles.css     # form styling (+ RTL)
│   ├── i18n.js        # all 5 translations
│   └── app.js         # language switching, validation, submit
├── index.html         # the form
├── requirements.txt
├── render.yaml
├── .env.example
└── README.md
```

---

*Demo built for portfolio purposes.*
