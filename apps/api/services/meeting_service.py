"""Business logic for meetings and participants. Routers are thin wrappers over these functions."""

import os
import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import MeetingPatch, RecentMeetingRead, ScheduleMeetingCreate

DEFAULT_DURATION_MINUTES = 30


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_utc_naive(dt: datetime) -> datetime:
    """Normalize to UTC and strip tzinfo for consistent SQLite storage/compare."""
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def _window_end(meeting: models.Meeting) -> datetime | None:
    """Scheduled end = start + duration. None for instant meetings."""
    if meeting.scheduled_start_time is None:
        return None
    minutes = meeting.duration_minutes or DEFAULT_DURATION_MINUTES
    return meeting.scheduled_start_time + timedelta(minutes=minutes)


def _generate_code() -> str:
    return "".join(random.choices(string.digits, k=9))


def generate_meeting_code(db: Session) -> str:
    """Generate a unique 9-digit numeric meeting code."""
    while True:
        code = _generate_code()
        if not db.query(models.Meeting).filter_by(meeting_code=code).first():
            return code


def generate_invite_link(meeting_code: str) -> str:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{frontend_url}/meeting/{meeting_code}"


def create_instant_meeting(db: Session, host_user_id: int) -> models.Meeting:
    code = generate_meeting_code(db)
    meeting = models.Meeting(
        meeting_code=code,
        title="Instant Meeting",
        status="live",
        host_user_id=host_user_id,
        invite_link=generate_invite_link(code),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def create_scheduled_meeting(
    db: Session, data: ScheduleMeetingCreate, host_user_id: int
) -> models.Meeting:
    start = _to_utc_naive(data.scheduled_start_time)
    if start <= _to_utc_naive(_utc_now()):
        raise HTTPException(
            status_code=400, detail="Scheduled time must be in the future"
        )

    code = generate_meeting_code(db)
    meeting = models.Meeting(
        meeting_code=code,
        title=data.title,
        description=data.description,
        status="scheduled",
        host_user_id=host_user_id,
        scheduled_start_time=start,
        duration_minutes=data.duration_minutes,
        invite_link=generate_invite_link(code),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def get_meeting_by_code(db: Session, meeting_code: str) -> models.Meeting | None:
    return db.query(models.Meeting).filter_by(meeting_code=meeting_code).first()


def get_upcoming_meetings(db: Session, user_id: int) -> list[models.Meeting]:
    """Scheduled meetings whose time window (start + duration) has not ended."""
    now = _to_utc_naive(_utc_now())
    scheduled = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.host_user_id == user_id,
            models.Meeting.status == "scheduled",
            models.Meeting.scheduled_start_time.isnot(None),
        )
        .all()
    )
    upcoming = [
        m for m in scheduled if (end := _window_end(m)) is not None and end > now
    ]
    return sorted(upcoming, key=lambda m: m.scheduled_start_time)


def get_recent_meetings(db: Session, user_id: int) -> list[RecentMeetingRead]:
    """Previous meetings: join history + missed scheduled meetings (window passed)."""
    now = _to_utc_naive(_utc_now())
    items: list[RecentMeetingRead] = []
    seen_meeting_ids: set[int] = set()

    recent_rows = (
        db.query(models.RecentMeeting)
        .filter(models.RecentMeeting.user_id == user_id)
        .order_by(models.RecentMeeting.joined_at.desc())
        .all()
    )
    for rm in recent_rows:
        seen_meeting_ids.add(rm.meeting_id)
        meeting = rm.meeting
        # Still in upcoming window — don't duplicate in previous
        end = _window_end(meeting)
        if meeting.status == "scheduled" and end is not None and end > now:
            continue
        items.append(
            RecentMeetingRead(
                id=rm.id,
                meeting_id=rm.meeting_id,
                user_id=rm.user_id,
                joined_at=rm.joined_at,
                list_type="joined",
                meeting=meeting,
            )
        )

    hosted_scheduled = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.host_user_id == user_id,
            models.Meeting.status == "scheduled",
            models.Meeting.scheduled_start_time.isnot(None),
        )
        .all()
    )
    for meeting in hosted_scheduled:
        if meeting.id in seen_meeting_ids:
            continue
        end = _window_end(meeting)
        if end is not None and end <= now:
            items.append(
                RecentMeetingRead(
                    id=meeting.id,
                    meeting_id=meeting.id,
                    user_id=user_id,
                    joined_at=None,
                    list_type="missed",
                    meeting=meeting,
                )
            )
            seen_meeting_ids.add(meeting.id)

    def sort_key(entry: RecentMeetingRead) -> datetime:
        if entry.joined_at is not None:
            return entry.joined_at
        return entry.meeting.scheduled_start_time or entry.meeting.created_at

    items.sort(key=sort_key, reverse=True)
    return items[:10]


def join_meeting(
    db: Session, meeting_code: str, display_name: str, user_id: int
) -> tuple[models.Meeting, models.Participant]:
    meeting = get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status == "ended":
        raise HTTPException(status_code=400, detail="Meeting has already ended")

    if meeting.status == "scheduled":
        meeting.status = "live"

    existing = (
        db.query(models.Participant)
        .filter(
            models.Participant.meeting_id == meeting.id,
            models.Participant.user_id == user_id,
            models.Participant.left_at.is_(None),
        )
        .first()
    )
    if existing:
        existing.display_name = display_name
        db.commit()
        db.refresh(meeting)
        db.refresh(existing)
        return meeting, existing

    role = "host" if meeting.host_user_id == user_id else "participant"
    participant = models.Participant(
        meeting_id=meeting.id,
        display_name=display_name,
        user_id=user_id,
        role=role,
    )
    db.add(participant)

    # Upsert RecentMeeting — skip if this user already has a record for this meeting
    existing_recent = (
        db.query(models.RecentMeeting)
        .filter_by(meeting_id=meeting.id, user_id=user_id)
        .first()
    )
    if not existing_recent:
        db.add(models.RecentMeeting(meeting_id=meeting.id, user_id=user_id))

    db.commit()
    db.refresh(meeting)
    db.refresh(participant)
    return meeting, participant


def end_meeting(db: Session, meeting_code: str, user_id: int) -> models.Meeting:
    meeting = get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_user_id != user_id:
        raise HTTPException(status_code=403, detail="Only the host can end the meeting")
    meeting.status = "ended"
    db.commit()
    db.refresh(meeting)
    return meeting


def patch_meeting(
    db: Session, meeting_code: str, user_id: int, data: MeetingPatch
) -> models.Meeting:
    meeting = get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_user_id != user_id:
        raise HTTPException(status_code=403, detail="Only the host can modify the meeting")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)
    return meeting
