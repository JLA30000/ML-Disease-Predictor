# Feedback API

Standalone FastAPI service for collecting feedback submissions from the app.

## What it provides

- `GET /health`
- `POST /feedback`
- `GET /feedback` protected by `x-api-key` when `FEEDBACK_ADMIN_API_KEY` is set
- SQLite persistence with a Render disk mount path already planned

## Folder layout

- `app/main.py`: FastAPI routes
- `app/models.py`: request/response models
- `app/database.py`: SQLite storage
- `app/config.py`: environment settings
- `render.yaml`: optional Render blueprint config

## Local run

1. Open a terminal in `feedback-api`
2. Create a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Optional: copy env values

```powershell
Copy-Item .env.example .env
```

5. Start the server:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

6. Test it:

```powershell
curl http://127.0.0.1:8001/health
```

Example feedback request:

```powershell
curl -X POST http://127.0.0.1:8001/feedback `
  -H "Content-Type: application/json" `
  -d "{\"submitted_by_provider\":\"guest\",\"role\":\"User\",\"symptoms\":[\"fever\",\"cough\"],\"diagnosis\":\"flu\",\"notes\":\"example note\"}"
```

If `FEEDBACK_ADMIN_API_KEY` is set, list feedback with:

```powershell
curl http://127.0.0.1:8001/feedback -H "x-api-key: YOUR_KEY"
```

## Expected request body

```json
{
  "submitted_by_provider": "email",
  "submitted_by_email": "user@example.com",
  "role": "Researcher",
  "symptoms": ["fever", "cough"],
  "diagnosis": "influenza",
  "notes": "Optional note"
}
```

## Render deployment

Render can deploy this as a separate web service from the same GitHub repo.

Important: Render's default Python version for newly created native Python services changed to 3.14.3 on February 11, 2026. This API is pinned to 3.12.8 via render.yaml, runtime.txt, and .python-version. If you create the service manually instead of syncing the Blueprint, set PYTHON_VERSION=3.12.8 in the Render dashboard before deploying.

Recommended settings:

- Root Directory: `feedback-api`
- Python Version: `3.12.8`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Disk: mount a persistent disk at `/var/data`
- `FEEDBACK_DB_PATH=/var/data/feedback.db`
- `FEEDBACK_ALLOWED_ORIGINS=*` initially, then restrict later
- `FEEDBACK_ADMIN_API_KEY=<generated secret>`

## Frontend hookup

To send app feedback here, add a client function in the app that posts to:

`POST https://YOUR-RENDER-SERVICE.onrender.com/feedback`

Payload shape matches the request schema above.

