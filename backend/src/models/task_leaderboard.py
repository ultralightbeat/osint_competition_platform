from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class TaskLeaderboard(db.Model):
    __tablename__ = "task_leaderboard"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"), nullable=False)
    
    solved_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    time_spent = db.Column(db.Integer, nullable=False)
    
    user = db.relationship("User", backref="task_solutions", lazy=True)
    task = db.relationship("Task", backref="leaderboard_entries", lazy=True)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'task_id', name='unique_user_task_solution'),
    )
