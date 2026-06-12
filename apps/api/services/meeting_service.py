"""Business logic for meetings and participants. Routers are thin wrappers over these functions."""

import os
import random
import string
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.schemas import MeetingPatch, ScheduleMeetingCreate


def _generate_code() -> str:
    return "".join(random.choices(string.digits, k=9))


def generate_meeting_code(db: Session) -> str:
    """Generate a unique 9-digit numeric meeting code."""
    while True:
        code = _generate_code()
        if not db.query(models.Meeting).filter_by(meeting_code=code).first():
            return code


def generate_invite_link(meeting_code: str) -> str:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
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
    code = generate_meeting_code(db)
    meeting = models.Meeting(
        meeting_code=code,
        title=data.title,
        description=data.description,
        status="scheduled",
        host_user_id=host_user_id,
        scheduled_start_time=data.scheduled_start_time,
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
    return (
        db.query(models.Meeting)
        .filter(
            models.Meeting.host_user_id == user_id,
            models.Meeting.status == "scheduled",
            models.Meeting.scheduled_start_time > datetime.now(timezone.utc),
        )
        .order_by(models.Meeting.scheduled_start_time.asc())
        .all()
    )


def get_recent_meetings(db: Session, user_id: int) -> list[models.RecentMeeting]:
    return (
        db.query(models.RecentMeeting)
        .filter(models.RecentMeeting.user_id == user_id)
        .order_by(models.RecentMeeting.joined_at.desc())
        .limit(10)
        .all()
    )


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
