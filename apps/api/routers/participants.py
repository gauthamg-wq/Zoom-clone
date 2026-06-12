from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.get("/{meeting_code}", response_model=list[schemas.ParticipantRead])
def list_participants(meeting_code: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter_by(meeting_code=meeting_code).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return (
        db.query(models.Participant)
        .filter(
            models.Participant.meeting_id == meeting.id,
            models.Participant.left_at.is_(None),
        )
        .all()
    )


@router.post("/{meeting_code}/leave")
def leave_meeting(
    meeting_code: str,
    participant_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    meeting = db.query(models.Meeting).filter_by(meeting_code=meeting_code).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participant = (
        db.query(models.Participant)
        .filter_by(id=participant_id, meeting_id=meeting.id)
        .first()
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.left_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}
