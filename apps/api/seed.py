"""
Seed script: populates the database with the default demo user and sample meetings.

Usage:
    cd apps/api
    uv run python seed.py

Re-running is safe — each section is independently idempotent.
"""

from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app import models


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Guard 1: create default user if not present
        if not db.query(models.User).filter_by(id=1).first():
            db.add(models.User(id=1, name="Demo User", email="demo@example.com"))
            db.commit()
            print("Seeded default user.")

        # Guard 2: seed meetings only if table is empty
        if db.query(models.Meeting).count() > 0:
            print("Meetings already seeded — skipping.")
            return

        now = datetime.now(timezone.utc)

        team_sync = models.Meeting(
            meeting_code="111111111",
            title="Team Sync",
            status="scheduled",
            host_user_id=1,
            scheduled_start_time=now + timedelta(hours=2),
            duration_minutes=30,
            invite_link="http://localhost:3000/meeting/111111111",
        )
        design_review = models.Meeting(
            meeting_code="222222222",
            title="Design Review",
            status="scheduled",
            host_user_id=1,
            scheduled_start_time=now + timedelta(days=1),
            duration_minutes=60,
            invite_link="http://localhost:3000/meeting/222222222",
        )
        sprint_planning = models.Meeting(
            meeting_code="333333333",
            title="Sprint Planning",
            status="ended",
            host_user_id=1,
            scheduled_start_time=now - timedelta(days=1),
            duration_minutes=45,
            invite_link="http://localhost:3000/meeting/333333333",
        )
        one_on_one = models.Meeting(
            meeting_code="444444444",
            title="1:1 with Manager",
            status="ended",
            host_user_id=1,
            scheduled_start_time=now - timedelta(days=2),
            duration_minutes=30,
            invite_link="http://localhost:3000/meeting/444444444",
        )

        db.add_all([team_sync, design_review, sprint_planning, one_on_one])
        db.flush()  # populate IDs before creating RecentMeeting rows

        db.add_all([
            models.RecentMeeting(
                meeting_id=sprint_planning.id,
                user_id=1,
                joined_at=now - timedelta(days=1),
            ),
            models.RecentMeeting(
                meeting_id=one_on_one.id,
                user_id=1,
                joined_at=now - timedelta(days=2),
            ),
        ])
        db.commit()
        print("Seeded meetings and recent_meeting rows.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
