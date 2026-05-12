from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    avatar_url = db.Column(db.String(500))

    oauth_provider = db.Column(db.String(50))
    oauth_id = db.Column(db.String(100))

    bio = db.Column(db.Text)
    country = db.Column(db.String(100))

    rating = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default="Student")

    is_creator = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)

    tasks_solved = db.Column(db.Integer, default=0)
    tournaments_won = db.Column(db.Integer, default=0)
    rooms_won = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    created_tournaments = db.relationship("Tournament", backref="creator", lazy=True)
    created_tasks = db.relationship("Task", backref="author", lazy=True)
    submissions = db.relationship("Submission", backref="user", lazy=True)
