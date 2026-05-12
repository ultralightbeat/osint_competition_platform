from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    player1_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))
    player2_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))
    selected_task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"))
    player1_ready = db.Column(db.Boolean, nullable=False, default=False)
    player2_ready = db.Column(db.Boolean, nullable=False, default=False)

    status = db.Column(db.String(20), default="waiting")

    winner_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))

    player1_score = db.Column(db.Integer, default=0)
    player2_score = db.Column(db.Integer, default=0)

    task_count = db.Column(db.Integer, default=5)
    time_limit = db.Column(db.Integer, default=300)
    difficulty = db.Column(db.String(20))
    task_types = db.Column(db.JSON)

    player1_rating_change = db.Column(db.Integer)
    player2_rating_change = db.Column(db.Integer)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    finished_at = db.Column(db.DateTime)

    tasks = db.relationship("RoomTask", backref="room", lazy=True)

class RoomTask(db.Model):
    __tablename__ = "room_tasks"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    room_id = db.Column(UUID(as_uuid=True), db.ForeignKey("rooms.id"))
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"))
    order = db.Column(db.Integer)

    solved_by = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))
    solved_at = db.Column(db.DateTime)
