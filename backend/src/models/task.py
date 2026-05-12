from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)

    author_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))

    task_type = db.Column(db.String(50), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    points = db.Column(db.Integer, nullable=False)

    content = db.Column(db.JSON)

    correct_answer = db.Column(db.String(500), nullable=False)
    answer_regex = db.Column(db.String(500))
    case_sensitive = db.Column(db.Boolean, default=False)

    times_solved = db.Column(db.Integer, default=0)
    times_attempted = db.Column(db.Integer, default=0)

    is_approved = db.Column(db.Boolean, default=False)
    is_public = db.Column(db.Boolean, default=True)
    is_tournament = db.Column(db.Boolean, nullable=False, default=False)
    tournament_ended = db.Column(db.Boolean, nullable=False, default=False)

    open_at = db.Column(db.DateTime, nullable=True)
    close_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tags = db.relationship("TaskTag", backref="task", lazy=True)
    hints = db.relationship(
        "TaskHint",
        backref="task",
        lazy=True,
        order_by="TaskHint.hint_order.asc()",
        cascade="all, delete-orphan",
    )

    def is_open(self):
        if self.is_tournament and self.tournament_ended:
            return False
        now = datetime.utcnow()
        if self.open_at and now < self.open_at:
            return False
        if self.close_at and now >= self.close_at:
            return False
        return True

    def get_status(self):
        if self.is_tournament and self.tournament_ended:
            return "archived"
        now = datetime.utcnow()
        if self.open_at and now < self.open_at:
            return "scheduled"
        if self.close_at and now >= self.close_at:
            return "archived"
        return "open"

class TaskTag(db.Model):
    __tablename__ = "task_tags"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"))
    tag = db.Column(db.String(50), nullable=False)
