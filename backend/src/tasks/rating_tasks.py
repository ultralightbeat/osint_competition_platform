from ..celery_app import celery
from ..extensions import db
from ..models import Room, User
from ..services.rating_service import calculate_elo, save_rating_history

@celery.task
def calculate_room_rating(room_id: str):
    room = Room.query.get(room_id)
    if not room:
        return
    player1 = User.query.get(room.player1_id)
    player2 = User.query.get(room.player2_id)
    if not player1 or not player2:
        return

    change1, change2 = calculate_elo(player1, player2, str(room.winner_id) if room.winner_id else None)

    save_rating_history(str(player1.id), change1, "room", room_id)
    save_rating_history(str(player2.id), change2, "room", room_id)

    room.player1_rating_change = change1
    room.player2_rating_change = change2
    db.session.commit()
