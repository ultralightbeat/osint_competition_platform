from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models import (
    User,
    Task,
    TaskTag,
    TaskHint,
    TaskLeaderboard,
    Submission,
    Tournament,
    TournamentParticipant,
    TournamentTask,
    Room,
    RoomTask,
    RatingHistory,
    UserMetrics,
)
from ...schemas import UserSchema
from ...extensions import db

users_bp = Blueprint("users", __name__)


def _get_current_user():
    return User.query.get(get_jwt_identity())


def _require_admin():
    current_user = _get_current_user()
    if not current_user or not current_user.is_admin:
        return None, (jsonify({"error": "Admin access required"}), 403)
    return current_user, None


@users_bp.get("/me")
@jwt_required()
def me():
    user = _get_current_user()
    return jsonify(UserSchema().dump(user))

@users_bp.put("/me")
@jwt_required()
def update_me():
    user = _get_current_user()
    data = request.get_json() or {}
    for field in ["avatar_url", "bio", "country"]:
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return jsonify(UserSchema().dump(user))

@users_bp.get("/<id>")
def get_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    return jsonify(UserSchema().dump(user))


@users_bp.get("/admin/dashboard")
@jwt_required()
def admin_dashboard():
    _, error_response = _require_admin()
    if error_response:
        return error_response

    search = (request.args.get("search") or "").strip()
    users_query = User.query
    if search:
        search_pattern = f"%{search}%"
        users_query = users_query.filter(
            db.or_(
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.country.ilike(search_pattern),
            )
        )

    users = users_query.order_by(User.created_at.desc()).all()

    total_tournament_wins = db.session.query(db.func.coalesce(db.func.sum(User.tournaments_won), 0)).scalar()

    return jsonify(
        {
            "stats": {
                "total_users": User.query.count(),
                "creators_count": User.query.filter_by(is_creator=True).count(),
                "tasks_count": Task.query.count(),
                "tournaments_count": Tournament.query.count(),
                "solved_tasks_count": TaskLeaderboard.query.count(),
                "solved_tournaments_count": int(total_tournament_wins or 0),
            },
            "users": UserSchema(many=True).dump(users),
            "search": search,
            "count": len(users),
        }
    )


@users_bp.delete("/admin/users/<id>")
@jwt_required()
def admin_delete_user(id):
    current_user, error_response = _require_admin()
    if error_response:
        return error_response

    user = User.query.get(id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    if str(user.id) == str(current_user.id):
        return jsonify({"error": "You cannot delete yourself"}), 400

    if user.is_admin:
        admins_count = User.query.filter_by(is_admin=True).count()
        if admins_count <= 1:
            return jsonify({"error": "Cannot delete the last administrator"}), 400

    created_task_ids = [task.id for task in Task.query.filter_by(author_id=user.id).all()]
    if created_task_ids:
        TaskTag.query.filter(TaskTag.task_id.in_(created_task_ids)).delete(synchronize_session=False)
        TaskHint.query.filter(TaskHint.task_id.in_(created_task_ids)).delete(synchronize_session=False)
        TaskLeaderboard.query.filter(TaskLeaderboard.task_id.in_(created_task_ids)).delete(synchronize_session=False)
        Submission.query.filter(Submission.task_id.in_(created_task_ids)).delete(synchronize_session=False)
        TournamentTask.query.filter(TournamentTask.task_id.in_(created_task_ids)).delete(synchronize_session=False)
        RoomTask.query.filter(RoomTask.task_id.in_(created_task_ids)).delete(synchronize_session=False)
        Room.query.filter(Room.selected_task_id.in_(created_task_ids)).update(
            {"selected_task_id": None},
            synchronize_session=False,
        )
        Task.query.filter(Task.id.in_(created_task_ids)).delete(synchronize_session=False)

    created_tournament_ids = [tournament.id for tournament in Tournament.query.filter_by(creator_id=user.id).all()]
    if created_tournament_ids:
        TournamentParticipant.query.filter(TournamentParticipant.tournament_id.in_(created_tournament_ids)).delete(
            synchronize_session=False
        )
        Submission.query.filter(Submission.tournament_id.in_(created_tournament_ids)).delete(synchronize_session=False)
        TournamentTask.query.filter(TournamentTask.tournament_id.in_(created_tournament_ids)).delete(
            synchronize_session=False
        )
        Tournament.query.filter(Tournament.id.in_(created_tournament_ids)).delete(synchronize_session=False)

    involved_room_ids = [
        room.id
        for room in Room.query.filter(
            db.or_(
                Room.player1_id == user.id,
                Room.player2_id == user.id,
                Room.winner_id == user.id,
            )
        ).all()
    ]
    if involved_room_ids:
        Submission.query.filter(Submission.room_id.in_(involved_room_ids)).delete(synchronize_session=False)
        RoomTask.query.filter(RoomTask.room_id.in_(involved_room_ids)).delete(synchronize_session=False)
        Room.query.filter(Room.id.in_(involved_room_ids)).delete(synchronize_session=False)

    RoomTask.query.filter_by(solved_by=user.id).update({"solved_by": None}, synchronize_session=False)
    TaskLeaderboard.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    TournamentParticipant.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    Submission.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    RatingHistory.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    UserMetrics.query.filter_by(user_id=user.id).delete(synchronize_session=False)

    db.session.delete(user)
    db.session.commit()
    return jsonify({"status": "deleted"})


@users_bp.put("/admin/users/<id>/creator")
@jwt_required()
def admin_set_creator_role(id):
    _, error_response = _require_admin()
    if error_response:
        return error_response

    user = User.query.get(id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    if "is_creator" not in data or not isinstance(data.get("is_creator"), bool):
        return jsonify({"error": "is_creator must be a boolean"}), 400

    user.is_creator = data["is_creator"]
    db.session.commit()
    return jsonify(UserSchema().dump(user))
