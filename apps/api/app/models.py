from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_start_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    # Allowed values: scheduled | live | ended
    status = Column(String, default="scheduled", nullable=False)
    invite_link = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    display_name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Allowed values: host | participant
    role = Column(String, default="participant", nullable=False)
    joined_at = Column(DateTime, server_default=func.now())
    left_at = Column(DateTime, nullable=True)
    is_muted = Column(Boolean, default=False, nullable=False)
    is_video_on = Column(Boolean, default=True, nullable=False)


class RecentMeeting(Base):
    __tablename__ = "recent_meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, server_default=func.now())

    meeting = relationship("Meeting", lazy="joined")
