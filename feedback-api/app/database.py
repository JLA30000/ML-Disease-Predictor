from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import settings


def _ensure_parent_dir(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)


_ensure_parent_dir(settings.db_path)


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback_submissions (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                submitted_by_provider TEXT NOT NULL,
                submitted_by_email TEXT,
                role TEXT NOT NULL,
                symptoms_json TEXT NOT NULL,
                diagnosis TEXT NOT NULL,
                notes TEXT
            )
            """
        )


def insert_feedback(record: dict[str, object]) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO feedback_submissions (
                id,
                created_at,
                submitted_by_provider,
                submitted_by_email,
                role,
                symptoms_json,
                diagnosis,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                record["created_at"],
                record["submitted_by_provider"],
                record.get("submitted_by_email"),
                record["role"],
                json.dumps(record["symptoms"]),
                record["diagnosis"],
                record.get("notes"),
            ),
        )


def list_feedback(limit: int, offset: int) -> list[dict[str, object]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                created_at,
                submitted_by_provider,
                submitted_by_email,
                role,
                symptoms_json,
                diagnosis,
                notes
            FROM feedback_submissions
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()

    results: list[dict[str, object]] = []
    for row in rows:
        results.append(
            {
                "id": row["id"],
                "created_at": row["created_at"],
                "submitted_by_provider": row["submitted_by_provider"],
                "submitted_by_email": row["submitted_by_email"],
                "role": row["role"],
                "symptoms": json.loads(row["symptoms_json"]),
                "diagnosis": row["diagnosis"],
                "notes": row["notes"],
            }
        )
    return results


def count_feedback() -> int:
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) AS count FROM feedback_submissions").fetchone()
    return int(row["count"]) if row else 0
