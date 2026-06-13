from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, field_serializer


def _serialize_utc_datetime(dt: datetime | None) -> str | None:
    """Emit UTC ISO-8601 with Z suffix so browsers parse correctly."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return f"{dt.isoformat()}Z"


class UserBase(BaseModel):
    name: str
    email: str
    avatar_url: str | None = None


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class MeetingBase(BaseModel):
    title: str
    description: str | None = None
    scheduled_start_time: datetime | None = None
    duration_minutes: int | None = None


class MeetingCreate(MeetingBase):
    pass


class MeetingRead(MeetingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_code: str
    host_user_id: int
    status: str
    invite_link: str | None = None
    created_at: datetime

    @field_serializer("scheduled_start_time", "created_at")
    def serialize_utc_datetimes(self, dt: datetime | None) -> str | None:
        return _serialize_utc_datetime(dt)


class ParticipantBase(BaseModel):
    display_name: str
    role: str = "participant"
    is_muted: bool = False
    is_video_on: bool = True


class ParticipantRead(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    user_id: int | None = None
    joined_at: datetime
    left_at: datetime | None = None

    @field_serializer("joined_at", "left_at")
    def serialize_utc_datetimes(self, dt: datetime | None) -> str | None:
        return _serialize_utc_datetime(dt)


class ScheduleMeetingCreate(BaseModel):
    title: str
    description: str | None = None
    scheduled_start_time: datetime
    duration_minutes: int | None = None


class JoinMeetingRequest(BaseModel):
    display_name: str


class MeetingPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    scheduled_start_time: datetime | None = None
    duration_minutes: int | None = None


class JoinMeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    meeting: MeetingRead
    participant: ParticipantRead


class RecentMeetingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    user_id: int
    joined_at: datetime | None = None
    list_type: str = "joined"  # joined | missed
    meeting: MeetingRead

    @field_serializer("joined_at")
    def serialize_joined_at(self, dt: datetime | None) -> str | None:
        return _serialize_utc_datetime(dt)
