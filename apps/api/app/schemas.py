from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
    joined_at: datetime
    meeting: MeetingRead
