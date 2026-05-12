from marshmallow import Schema, fields

class TaskSchema(Schema):
    id = fields.UUID()
    title = fields.Str()
    description = fields.Str()
    author_id = fields.UUID()
    task_type = fields.Str()
    difficulty = fields.Str()
    points = fields.Int()
    times_solved = fields.Int()
    times_attempted = fields.Int()
    content = fields.Dict()
    is_approved = fields.Bool()
    is_public = fields.Bool()
    is_tournament = fields.Bool()
    tournament_ended = fields.Bool()
    open_at = fields.Method("get_open_at")
    close_at = fields.Method("get_close_at")
    hints = fields.Method("get_hints")
    tags = fields.Method("get_tags")
    status = fields.Method("get_status")
    created_at = fields.DateTime()
    
    def get_hints(self, obj):
        hints = getattr(obj, "hints", None) or []
        return [hint.text for hint in sorted(hints, key=lambda item: item.hint_order)]

    def get_tags(self, obj):
        tags = getattr(obj, "tags", None) or []
        return [{"tag": tag.tag} for tag in tags]

    def get_status(self, obj):
        return obj.get_status()

    def _to_utc_iso(self, dt):
        if not dt:
            return None
        return f"{dt.isoformat()}Z"

    def get_open_at(self, obj):
        return self._to_utc_iso(getattr(obj, "open_at", None))

    def get_close_at(self, obj):
        return self._to_utc_iso(getattr(obj, "close_at", None))
