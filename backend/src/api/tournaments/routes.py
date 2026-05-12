from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...extensions import db
from ...models import Tournament, TournamentParticipant
from ...schemas import TournamentSchema


tournaments_bp = Blueprint("tournaments", __name__)

@tournaments_bp.get("")
def list_tournaments():
    items = Tournament.query.order_by(Tournament.start_time.desc()).all()
    return jsonify(TournamentSchema(many=True).dump(items))

@tournaments_bp.post("")
@jwt_required()
def create_tournament():
    data = request.get_json() or {}
    t = Tournament(
        title=data.get("title", "Untitled"),
        description=data.get("description"),
        creator_id=get_jwt_identity(),
        is_public=data.get("is_public", True),
        max_participants=data.get("max_participants", 100),
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(TournamentSchema().dump(t)), 201

@tournaments_bp.get("/<id>")
def get_tournament(id):
    t = Tournament.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    return jsonify(TournamentSchema().dump(t))

@tournaments_bp.put("/<id>")
@jwt_required()
def update_tournament(id):
    t = Tournament.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    for field in ["title", "description", "is_public", "max_participants", "start_time", "end_time", "status", "rating_change_enabled"]:
        if field in data:
            setattr(t, field, data[field])
    db.session.commit()
    return jsonify(TournamentSchema().dump(t))

@tournaments_bp.delete("/<id>")
@jwt_required()
def delete_tournament(id):
    t = Tournament.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"status": "deleted"})

@tournaments_bp.post("/<id>/join")
@jwt_required()
def join_tournament(id):
    t = Tournament.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    p = TournamentParticipant(tournament_id=id, user_id=get_jwt_identity())
    db.session.add(p)
    db.session.commit()
    return jsonify({"status": "joined"})

@tournaments_bp.post("/<id>/leave")
@jwt_required()
def leave_tournament(id):
    TournamentParticipant.query.filter_by(tournament_id=id, user_id=get_jwt_identity()).delete()
    db.session.commit()
    return jsonify({"status": "left"})
