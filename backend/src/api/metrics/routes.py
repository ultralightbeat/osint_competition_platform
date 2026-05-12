from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ...models import UserMetrics, PlatformMetrics

metrics_bp = Blueprint("metrics", __name__)

@metrics_bp.get("/user/<id>")
@jwt_required()
def user_metrics(id):
    items = UserMetrics.query.filter_by(user_id=id).all()
    return jsonify([
        {
            "date": m.date.isoformat(),
            "tasks_attempted": m.tasks_attempted,
            "tasks_solved": m.tasks_solved,
            "time_spent": m.time_spent,
        }
        for m in items
    ])

@metrics_bp.get("/platform")
@jwt_required()
def platform_metrics():
    items = PlatformMetrics.query.order_by(PlatformMetrics.date.desc()).limit(30).all()
    return jsonify([
        {
            "date": m.date.isoformat(),
            "active_users": m.active_users,
            "new_users": m.new_users,
            "tasks_created": m.tasks_created,
            "tournaments_created": m.tournaments_created,
            "rooms_played": m.rooms_played,
            "total_submissions": m.total_submissions,
            "correct_submissions": m.correct_submissions,
        }
        for m in items
    ])

@metrics_bp.get("/tasks")
@jwt_required()
def tasks_stats():
    return jsonify({"status": "todo"})
