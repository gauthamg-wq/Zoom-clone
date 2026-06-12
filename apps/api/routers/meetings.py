import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import schemas
from services import meeting_service

router = APIRouter()

DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", "1"))


@router.get("/upcoming", response_model=list[schemas.MeetingRead])
def list_upcoming_meetings(db: Session = Depends(get_db)):
    return meeting_service.get_upcoming_meetings(db, DEFAULT_USER_ID)


@router.get("/recent", response_model=list[schemas.RecentMeetingRead])
def list_recent_meetings(db: Session = Depends(get_db)):
    return meeting_service.get_recent_meetings(db, DEFAULT_USER_ID)


@router.post("/instant", response_model=schemas.MeetingRead, status_code=201)
def create_instant_meeting(db: Session = Depends(get_db)):
    return meeting_service.create_instant_meeting(db, DEFAULT_USER_ID)


@router.post("/schedule", response_model=schemas.MeetingRead, status_code=201)
def schedule_meeting(
    data: schemas.ScheduleMeetingCreate, db: Session = Depends(get_db)
):
    return meeting_service.create_scheduled_meeting(db, data, DEFAULT_USER_ID)


@router.get("/{meeting_code}", response_model=schemas.MeetingRead)
def get_meeting(meeting_code: str, db: Session = Depends(get_db)):
    meeting = meeting_service.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/{meeting_code}/join", response_model=schemas.JoinMeetingResponse)
def join_meeting(
    meeting_code: str,
    body: schemas.JoinMeetingRequest,
    db: Session = Depends(get_db),
):
    meeting, participant = meeting_service.join_meeting(
        db, meeting_code, body.display_name, DEFAULT_USER_ID
    )
    return schemas.JoinMeetingResponse(meeting=meeting, participant=participant)


@router.patch("/{meeting_code}", response_model=schemas.MeetingRead)
def patch_meeting(
    meeting_code: str,
    data: schemas.MeetingPatch,
    db: Session = Depends(get_db),
):
    return meeting_service.patch_meeting(db, meeting_code, DEFAULT_USER_ID, data)
