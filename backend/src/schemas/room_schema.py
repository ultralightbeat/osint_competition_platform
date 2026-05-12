from marshmallow import Schema, fields
from ..models import User
from ..services.rank_service import get_rank_by_rating

class RoomSchema(Schema):
    id = fields.UUID()
    player1_id = fields.UUID()
    player2_id = fields.UUID()
    selected_task_id = fields.UUID(allow_none=True)
    player1_ready = fields.Bool()
    player2_ready = fields.Bool()
    status = fields.Str()
    winner_id = fields.UUID()
    player1_score = fields.Int()
    player2_score = fields.Int()
    task_count = fields.Int()
    time_limit = fields.Int()
    difficulty = fields.Str()
    task_types = fields.List(fields.Str())
    created_at = fields.DateTime()
    started_at = fields.DateTime()
    finished_at = fields.DateTime()
    player1 = fields.Method("get_player1")
    player2 = fields.Method("get_player2")

    def _serialize_player(self, user_id):
        if not user_id:
            return None
        user = User.query.get(user_id)
        if not user:
            return None
        return {
            "id": str(user.id),
            "username": user.username,
            "avatar_url": user.avatar_url,
            "rank": get_rank_by_rating(user.rating),
            "rating": user.rating,
        }

    def get_player1(self, obj):
        return self._serialize_player(obj.player1_id)

    def get_player2(self, obj):
        return self._serialize_player(obj.player2_id)
