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
from services.meeting_service import generate_meeting_code, generate_invite_link


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

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        def make_meeting(**kwargs) -> models.Meeting:
            code = generate_meeting_code(db)
            return models.Meeting(
                meeting_code=code,
                invite_link=generate_invite_link(code),
                host_user_id=1,
                **kwargs,
            )

        # 3 upcoming scheduled meetings
        team_sync = make_meeting(
            title="Team Sync",
            status="scheduled",
            scheduled_start_time=now + timedelta(hours=2),
            duration_minutes=30,
        )
        design_review = make_meeting(
            title="Design Review",
            status="scheduled",
            scheduled_start_time=now + timedelta(days=1, hours=9),
            duration_minutes=60,
        )
        all_hands = make_meeting(
            title="Engineering All-Hands",
            status="scheduled",
            scheduled_start_time=now + timedelta(days=3),
            duration_minutes=90,
        )

        # 3 ended meetings
        sprint_planning = make_meeting(
            title="Sprint Planning",
            status="ended",
            scheduled_start_time=now - timedelta(days=1),
            duration_minutes=45,
        )
        one_on_one = make_meeting(
            title="1:1 with Manager",
            status="ended",
            scheduled_start_time=now - timedelta(days=2),
            duration_minutes=30,
        )
        client_demo = make_meeting(
            title="Client Demo",
            status="ended",
            scheduled_start_time=now - timedelta(days=4),
            duration_minutes=60,
        )

        db.add_all([team_sync, design_review, all_hands, sprint_planning, one_on_one, client_demo])
        db.flush()

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
            models.RecentMeeting(
                meeting_id=client_demo.id,
                user_id=1,
                joined_at=now - timedelta(days=4),
            ),
        ])
        db.commit()
        print("Seeded 3 upcoming + 3 ended meetings with recent_meeting rows.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
