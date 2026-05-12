from ..models import User, RatingHistory
from ..extensions import db
from .rank_service import get_rank_by_rating


def calculate_elo(p1: User, p2: User, winner_id: str | None, k_factor: int = 32):
    expected1 = 1 / (1 + 10 ** ((p2.rating - p1.rating) / 400))
    expected2 = 1 - expected1

    if winner_id == str(p1.id):
        score1, score2 = 1, 0
    elif winner_id == str(p2.id):
        score1, score2 = 0, 1
    else:
        score1, score2 = 0.5, 0.5

    change1 = round(k_factor * (score1 - expected1))
    change2 = round(k_factor * (score2 - expected2))
    return change1, change2


def save_rating_history(user_id: str, change: int, source_type: str, source_id: str | None):
    user = User.query.get(user_id)
    if not user:
        return
    old = user.rating
    user.rating = old + change
    user.rank = get_rank_by_rating(user.rating)

    rh = RatingHistory(
        user_id=user_id,
        old_rating=old,
        new_rating=user.rating,
        change=change,
        source_type=source_type,
        source_id=source_id,
    )
    db.session.add(rh)
    db.session.commit()
