"""
Seed script: populates the database with the default demo user required by the MVP.

Usage:
    cd apps/api
    uv run python seed.py

Re-running is safe — the script is idempotent (skips if user id=1 already exists).
"""

from app.database import Base, SessionLocal, engine
from app import models


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).filter_by(id=1).first():
            print("Default user already exists — skipping seed.")
            return

        default_user = models.User(
            id=1,
            name="Demo User",
            email="demo@example.com",
            avatar_url=None,
        )
        db.add(default_user)
        db.commit()
        print("Seeded default user (id=1).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
