from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class TaskHint(db.Model):
    __tablename__ = "task_hints"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey("tasks.id"), nullable=False)
    hint_order = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
