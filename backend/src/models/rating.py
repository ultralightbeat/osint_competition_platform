from datetime import datetime
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db

class RatingHistory(db.Model):
    __tablename__ = "rating_history"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))

    old_rating = db.Column(db.Integer)
    new_rating = db.Column(db.Integer)
    change = db.Column(db.Integer)

    source_type = db.Column(db.String(20))
    source_id = db.Column(UUID(as_uuid=True))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
