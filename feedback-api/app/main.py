from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import count_feedback, init_db, insert_feedback, list_feedback
from .models import (
    FeedbackSubmissionCreate,
    FeedbackSubmissionCreated,
    FeedbackSubmissionRecord,
    HealthResponse,
)


app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if settings.allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


def require_admin_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if not settings.admin_api_key:
        return
    if x_api_key == settings.admin_api_key:
        return
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid x-api-key header.",
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", feedback_count=count_feedback())


@app.post(
    "/feedback",
    response_model=FeedbackSubmissionCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback(payload: FeedbackSubmissionCreate) -> FeedbackSubmissionCreated:
    record = FeedbackSubmissionRecord.from_create(payload)
    insert_feedback(record.model_dump())
    return FeedbackSubmissionCreated(
        id=record.id,
        created_at=record.created_at,
    )


@app.get("/feedback", response_model=list[FeedbackSubmissionRecord])
def get_feedback(
    _authorized: None = Depends(require_admin_api_key),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[FeedbackSubmissionRecord]:
    records = list_feedback(limit=limit, offset=offset)
    return [FeedbackSubmissionRecord(**record) for record in records]
