from flask import Blueprint, jsonify
from ...models import User, RatingHistory
from ...services.rank_service import RANK_THRESHOLDS, get_rank_by_rating

ratings_bp = Blueprint("ratings", __name__)

@ratings_bp.get("/leaderboard")
def leaderboard():
    users = User.query.order_by(User.rating.desc()).limit(100).all()
    return jsonify([
        {
            "id": str(u.id),
            "username": u.username,
            "avatar_url": u.avatar_url,
            "rating": u.rating,
            "rank": get_rank_by_rating(u.rating),
        }
        for u in users
    ])

@ratings_bp.get("/user/<id>")
def user_rating_history(id):
    items = RatingHistory.query.filter_by(user_id=id).order_by(RatingHistory.created_at.desc()).all()
    return jsonify([
        {
            "old_rating": r.old_rating,
            "new_rating": r.new_rating,
            "change": r.change,
            "source_type": r.source_type,
            "source_id": str(r.source_id) if r.source_id else None,
            "created_at": r.created_at.isoformat(),
        }
        for r in items
    ])

@ratings_bp.get("/ranks")
def ranks():
    ranges = {}
    for index, (rank_name, min_rating) in enumerate(RANK_THRESHOLDS):
        if index == len(RANK_THRESHOLDS) - 1:
            ranges[rank_name] = f"{min_rating}+"
        else:
            max_rating = RANK_THRESHOLDS[index + 1][1] - 1
            ranges[rank_name] = f"{min_rating}-{max_rating}"
    return jsonify(ranges)
