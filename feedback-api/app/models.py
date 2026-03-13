from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FeedbackSubmissionCreate(BaseModel):
    submitted_by_provider: str = Field(pattern="^(email|guest)$")
    submitted_by_email: str | None = None
    role: str = Field(pattern="^(Researcher|User)$")
    symptoms: list[str]
    diagnosis: str
    notes: str | None = None

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item and item.strip()]
        if not cleaned:
            raise ValueError("At least one symptom is required.")
        return cleaned

    @field_validator("diagnosis")
    @classmethod
    def validate_diagnosis(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Diagnosis is required.")
        return cleaned

    @field_validator("submitted_by_email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        return cleaned or None

    @field_validator("notes")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class FeedbackSubmissionRecord(FeedbackSubmissionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: str

    @classmethod
    def from_create(cls, payload: FeedbackSubmissionCreate) -> "FeedbackSubmissionRecord":
        return cls(
            id=str(uuid4()),
            created_at=datetime.now(timezone.utc).isoformat(),
            **payload.model_dump(),
        )


class FeedbackSubmissionCreated(BaseModel):
    ok: bool = True
    id: str
    created_at: str


class HealthResponse(BaseModel):
    status: str
    feedback_count: int
