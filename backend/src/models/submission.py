from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"))

    tournament_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tournaments.id"))
    room_id = db.Column(UUID(as_uuid=True), db.ForeignKey("rooms.id"))

    answer = db.Column(db.String(500), nullable=False)
    is_correct = db.Column(db.Boolean)

    time_spent = db.Column(db.Integer)
    used_hints_count = db.Column(db.Integer, default=0, nullable=False)
    penalty_percent = db.Column(db.Integer, default=0, nullable=False)
    penalty_time_spent = db.Column(db.Integer, default=0, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
