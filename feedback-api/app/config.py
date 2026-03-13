from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _split_origins(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    app_name: str = os.getenv("FEEDBACK_APP_NAME", "ML Disease Predictor Feedback API")
    db_path: str = os.getenv(
        "FEEDBACK_DB_PATH",
        str(DATA_DIR / "feedback.db"),
    )
    allowed_origins: list[str] = _split_origins(
        os.getenv("FEEDBACK_ALLOWED_ORIGINS", "*")
    )
    admin_api_key: str | None = os.getenv("FEEDBACK_ADMIN_API_KEY") or None


settings = Settings()
