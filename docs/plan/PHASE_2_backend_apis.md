# Phase 2 — Backend REST APIs + Service Layer + Seed Data

## Goal

Implement all meeting and participant REST endpoints so the frontend has a fully working API to call. Introduce a thin service layer to keep routes clean.

---

## Files to Create

### `apps/api/services/__init__.py`

Empty init file.

### `apps/api/services/meeting_service.py`

All business logic lives here; routes stay as thin wrappers.

Functions to implement:

- `generate_meeting_code(db) -> str`
  - Generate a random 9-digit numeric string (e.g. `"123456789"`)
  - Query DB to ensure uniqueness; regenerate if collision
  - Use `random.choices(string.digits, k=9)`

- `generate_invite_link(meeting_code: str) -> str`
  - Read `FRONTEND_URL` from env (default `"http://localhost:3000"`)
  - Return `f"{frontend_url}/meeting/{meeting_code}"`

- `create_instant_meeting(db, host_user_id: int) -> Meeting`
  - Generate code + invite link
  - Create `Meeting(title="Instant Meeting", status="live", ...)`
  - Commit and return

- `create_scheduled_meeting(db, data: ScheduleMeetingCreate, host_user_id: int) -> Meeting`
  - Generate code + invite link
  - Create `Meeting(status="scheduled", ...)`
  - Commit and return

- `get_meeting_by_code(db, meeting_code: str) -> Meeting | None`
  - Simple query filter

- `get_upcoming_meetings(db, user_id: int) -> list[Meeting]`
  - `status = "scheduled"` AND `scheduled_start_time > datetime.now(timezone.utc)`
  - Filter by `host_user_id = user_id`
  - Order by `scheduled_start_time ASC`

- `get_recent_meetings(db, user_id: int) -> list[RecentMeetingWithMeeting]`
  - Join `recent_meetings` + `meetings`
  - Filter by `recent_meetings.user_id = user_id`
  - Order by `recent_meetings.joined_at DESC`
  - Limit 10

- `join_meeting(db, meeting_code: str, display_name: str, user_id: int) -> tuple[Meeting, Participant]`
  - Look up meeting by code; raise 404 if not found
  - Raise 400 if status = "ended"
  - If status = "scheduled": update to "live"
  - Determine role: "host" if `meeting.host_user_id == user_id` else "participant"
  - Create `Participant` record
  - Upsert `RecentMeeting` (insert if not exists for this user+meeting)
  - Commit and return both objects

- `end_meeting(db, meeting_code: str, user_id: int) -> Meeting`
  - Look up meeting; raise 404 if not found
  - Raise 403 if caller is not host
  - Set `status = "ended"`, commit, return

- `patch_meeting(db, meeting_code: str, user_id: int, data: MeetingPatch) -> Meeting`
  - Look up meeting; raise 404 if missing
  - Raise 403 if caller is not host
  - Apply non-None fields from `data`
  - Commit and return

---

## Files to Edit

### `apps/api/app/schemas.py`

Add these new schemas:

```python
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
    status: str | None = None   # "scheduled" | "live" | "ended"
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
    meeting: MeetingRead      # ← nested meeting details for dashboard display
```

### `apps/api/routers/meetings.py`

Implement all 7 endpoints:

```
GET  /meetings/upcoming       → list[MeetingRead]
GET  /meetings/recent         → list[RecentMeetingRead]
GET  /meetings/{meeting_code} → MeetingRead  (404 if not found)
POST /meetings/instant        → MeetingRead  (201)
POST /meetings/schedule       → MeetingRead  (201)
POST /meetings/{meeting_code}/join → JoinMeetingResponse (200)
PATCH /meetings/{meeting_code}     → MeetingRead
```

All routes use `DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", "1"))` for the acting user.
All routes inject `db: Session = Depends(get_db)`.
Routes delegate to `meeting_service.*` — no SQL in the router file.

### `apps/api/routers/participants.py`

Implement 2 endpoints:

```
GET  /participants/{meeting_code}         → list[ParticipantRead]
POST /participants/{meeting_code}/leave   → {"ok": true}
```

- `GET` returns participants where `left_at IS NULL`
- `POST /leave` accepts `{"participant_id": int}` body (or use query param), sets `left_at = datetime.now(timezone.utc)`

### `apps/api/seed.py`

Extend with sample meetings after creating the user:

```python
# 2 upcoming scheduled meetings
Meeting(title="Team Sync", status="scheduled",
        scheduled_start_time=now + timedelta(hours=2), duration_minutes=30, ...)
Meeting(title="Design Review", status="scheduled",
        scheduled_start_time=now + timedelta(days=1), duration_minutes=60, ...)

# 2 ended meetings + their recent_meeting records
Meeting(title="Sprint Planning", status="ended",
        scheduled_start_time=now - timedelta(days=1), duration_minutes=45, ...)
Meeting(title="1:1 with Manager", status="ended",
        scheduled_start_time=now - timedelta(days=2), duration_minutes=30, ...)

# RecentMeeting rows for the 2 ended meetings
RecentMeeting(meeting_id=<sprint>, user_id=1, joined_at=now - timedelta(days=1))
RecentMeeting(meeting_id=<1on1>, user_id=1, joined_at=now - timedelta(days=2))
```

**Seed idempotency:** The existing `seed.py` returns early at the top-level if `user id=1` already exists — this would silently skip meeting creation for anyone who ran the Phase 1 seed. Phase 2 must restructure this into two independent guards so that both the user creation and the meeting creation are each individually idempotent:

```python
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

        now = datetime.now(timezone.utc)  # utcnow() is deprecated in Python 3.12
        # ... create meeting objects ...
        db.commit()
        print("Seeded meetings and recent_meeting rows.")
    finally:
        db.close()
```

This allows the script to be safely re-run after a Phase 1 seed without skipping meeting creation.

---

## Key Design Decisions

| Decision              | Choice                                          | Reason                                  |
| --------------------- | ----------------------------------------------- | --------------------------------------- |
| Meeting code format   | 9-digit numeric string `"123456789"`            | Assignment spec                         |
| Invite link base URL  | `FRONTEND_URL` env var                          | Configurable for prod deploy            |
| Auth                  | `DEFAULT_USER_ID=1` from env                    | No auth for MVP                         |
| Status transition     | `scheduled → live` when first participant joins | Automatic, no manual step               |
| RecentMeeting upsert  | Skip if `(meeting_id, user_id)` already exists  | Idempotent re-joins                     |
| `PATCH /meetings` use | End meeting (status→ended) + update title/desc  | Covers host controls + scheduling edits |

---

## Acceptance Criteria

- `GET /health` still returns 200
- `GET /meetings/upcoming` returns 2 seeded upcoming meetings
- `GET /meetings/recent` returns 2 seeded recent meetings with nested meeting data
- `POST /meetings/instant` returns `meeting_code` and `invite_link`
- `GET /meetings/{code}` returns 404 for unknown code
- `POST /meetings/{code}/join` returns participant + meeting; joining own meeting gives role=host
- `GET /participants/{code}` returns active participants (left_at IS NULL)
- All responses are properly serialised Pydantic models (no `datetime` serialisation errors)
