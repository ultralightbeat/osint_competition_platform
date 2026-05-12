from marshmallow import Schema, fields

class TaskLeaderboardSchema(Schema):
    id = fields.UUID()
    user_id = fields.UUID()
    task_id = fields.UUID()
    solved_at = fields.DateTime()
    time_spent = fields.Int()
