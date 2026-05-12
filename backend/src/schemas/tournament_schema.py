from marshmallow import Schema, fields

class TournamentSchema(Schema):
    id = fields.UUID()
    title = fields.Str()
    description = fields.Str()
    creator_id = fields.UUID()
    is_public = fields.Bool()
    max_participants = fields.Int()
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    status = fields.Str()
    rating_change_enabled = fields.Bool()
    created_at = fields.DateTime()
