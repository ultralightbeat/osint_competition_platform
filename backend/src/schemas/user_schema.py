from marshmallow import Schema, fields
from ..services.rank_service import get_rank_by_rating

class UserSchema(Schema):
    id = fields.UUID()
    username = fields.Str()
    email = fields.Email()
    avatar_url = fields.Str()
    bio = fields.Str()
    country = fields.Str()
    rating = fields.Int()
    rank = fields.Method("get_rank")
    is_creator = fields.Bool()
    is_admin = fields.Bool()
    tasks_solved = fields.Int()
    tournaments_won = fields.Int()
    rooms_won = fields.Int()
    created_at = fields.DateTime()
    last_login = fields.DateTime()
    oauth_provider = fields.Str()

    def get_rank(self, obj):
        return get_rank_by_rating(obj.rating)
