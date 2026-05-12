from marshmallow import Schema, fields

class SubmissionSchema(Schema):
    id = fields.UUID()
    user_id = fields.UUID()
    task_id = fields.UUID()
    tournament_id = fields.UUID()
    room_id = fields.UUID()
    answer = fields.Str()
    is_correct = fields.Bool()
    time_spent = fields.Int()
    used_hints_count = fields.Int()
    penalty_percent = fields.Int()
    penalty_time_spent = fields.Int()
    submitted_at = fields.DateTime()
