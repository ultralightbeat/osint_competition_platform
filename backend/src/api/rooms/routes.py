from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...extensions import db
from ...models import Room, RoomTask, Task
from ...schemas import RoomSchema

rooms_bp = Blueprint("rooms", __name__)


def _same_user(uuid_value, user_id):
    return uuid_value is not None and str(uuid_value) == str(user_id)


@rooms_bp.get("")
def list_rooms():
    rooms = Room.query.filter(Room.status != "finished").order_by(Room.created_at.desc()).all()
    return jsonify(RoomSchema(many=True).dump(rooms))

@rooms_bp.post("")
@jwt_required()
def create_room():
    data = request.get_json() or {}
    task_id = data.get("task_id")
    if not task_id:
        return jsonify({"error": "task_id is required"}), 400

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    room = Room(
        player1_id=get_jwt_identity(),
        selected_task_id=task.id,
        player1_ready=False,
        player2_ready=False,
        task_count=1,
        time_limit=data.get("time_limit", 300),
        difficulty=task.difficulty,
        task_types=[task.task_type],
    )
    db.session.add(room)
    db.session.flush()
    db.session.add(
        RoomTask(
            room_id=room.id,
            task_id=task.id,
            order=1,
        )
    )
    db.session.commit()
    return jsonify(RoomSchema().dump(room)), 201

@rooms_bp.get("/<id>")
def get_room(id):
    r = Room.query.get(id)
    if not r:
        return jsonify({"error": "Not found"}), 404
    if r.status == "finished":
        return jsonify({"error": "Room is closed"}), 410
    return jsonify(RoomSchema().dump(r))

@rooms_bp.post("/<id>/join")
@jwt_required()
def join_room(id):
    r = Room.query.get(id)
    if not r:
        return jsonify({"error": "Not found"}), 404
    user_id = get_jwt_identity()
    if _same_user(r.player1_id, user_id) or _same_user(r.player2_id, user_id):
        return jsonify(RoomSchema().dump(r))
    if r.status in ["active", "finished"]:
        return jsonify({"error": "Room already started or finished"}), 409
    if r.player2_id and not _same_user(r.player2_id, user_id):
        return jsonify({"error": "Room full"}), 409
    r.player2_id = user_id
    r.player2_ready = False
    r.status = "waiting"
    db.session.commit()
    return jsonify(RoomSchema().dump(r))

@rooms_bp.post("/<id>/ready")
@jwt_required()
def ready_room(id):
    r = Room.query.get(id)
    if not r:
        return jsonify({"error": "Not found"}), 404

    user_id = get_jwt_identity()
    if not _same_user(r.player1_id, user_id) and not _same_user(r.player2_id, user_id):
        return jsonify({"error": "Only room players can set ready"}), 403
    if not r.player1_id or not r.player2_id:
        return jsonify({"error": "Нужно 2 человека для старта"}), 400
    if r.status == "finished":
        return jsonify({"error": "Room already finished"}), 409

    if r.status == "active":
        return jsonify({"error": "Room already active"}), 409

    ready_state = bool((request.get_json() or {}).get("ready", True))
    if _same_user(r.player1_id, user_id):
        r.player1_ready = ready_state
    if _same_user(r.player2_id, user_id):
        r.player2_ready = ready_state

    if r.player1_ready and r.player2_ready:
        r.status = "active"
        if not r.started_at:
            r.started_at = datetime.utcnow()
    else:
        r.status = "waiting"

    db.session.commit()
    return jsonify(RoomSchema().dump(r))

@rooms_bp.post("/<id>/leave")
@jwt_required()
def leave_room(id):
    r = Room.query.get(id)
    if not r:
        return jsonify({"error": "Not found"}), 404
    user_id = get_jwt_identity()
    if _same_user(r.player1_id, user_id):
        r.player1_id = None
        r.player1_ready = False
    if _same_user(r.player2_id, user_id):
        r.player2_id = None
        r.player2_ready = False

    if r.status == "active" and not r.winner_id:
        remaining_player = r.player1_id or r.player2_id
        if remaining_player:
            r.winner_id = remaining_player
    elif not r.player1_id and not r.player2_id:
        r.status = "finished"
        r.finished_at = datetime.utcnow()
    elif r.winner_id:
        r.status = "active"
    else:
        r.status = "waiting"
    db.session.commit()
    return jsonify({"status": "left"})

@rooms_bp.post("/matchmaking")
@jwt_required()
def matchmaking_start():
    return jsonify({"status": "searching"})

@rooms_bp.delete("/matchmaking")
@jwt_required()
def matchmaking_cancel():
    return jsonify({"status": "cancelled"})
