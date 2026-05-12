from datetime import date
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class UserMetrics(db.Model):
    __tablename__ = "user_metrics"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))

    date = db.Column(db.Date, nullable=False, default=date.today)
    tasks_attempted = db.Column(db.Integer, default=0)
    tasks_solved = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Integer, default=0)

    text_tasks_solved = db.Column(db.Integer, default=0)
    image_tasks_solved = db.Column(db.Integer, default=0)
    social_tasks_solved = db.Column(db.Integer, default=0)

    easy_solved = db.Column(db.Integer, default=0)
    medium_solved = db.Column(db.Integer, default=0)
    hard_solved = db.Column(db.Integer, default=0)
    expert_solved = db.Column(db.Integer, default=0)

class PlatformMetrics(db.Model):
    __tablename__ = "platform_metrics"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    date = db.Column(db.Date, nullable=False, unique=True, default=date.today)

    active_users = db.Column(db.Integer, default=0)
    new_users = db.Column(db.Integer, default=0)

    tasks_created = db.Column(db.Integer, default=0)
    tournaments_created = db.Column(db.Integer, default=0)
    rooms_played = db.Column(db.Integer, default=0)

    total_submissions = db.Column(db.Integer, default=0)
    correct_submissions = db.Column(db.Integer, default=0)
