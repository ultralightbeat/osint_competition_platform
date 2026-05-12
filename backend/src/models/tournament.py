from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class Tournament(db.Model):
    __tablename__ = "tournaments"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    creator_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))

    is_public = db.Column(db.Boolean, default=True)
    max_participants = db.Column(db.Integer, default=100)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)

    status = db.Column(db.String(20), default="draft")
    rating_change_enabled = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship("TournamentTask", backref="tournament", lazy=True)
    participants = db.relationship("TournamentParticipant", backref="tournament", lazy=True)

class TournamentParticipant(db.Model):
    __tablename__ = "tournament_participants"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    tournament_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tournaments.id"))
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))

    score = db.Column(db.Integer, default=0)
    rank = db.Column(db.Integer)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

# Association between tournaments and tasks
class TournamentTask(db.Model):
    __tablename__ = "tournament_tasks"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    tournament_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tournaments.id"))
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"))
    order = db.Column(db.Integer)
