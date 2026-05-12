from ..extensions import db
from ..models import User


def update_stats(user_id: str, tasks_solved_inc: int = 0):
    user = User.query.get(user_id)
    if not user:
        return
    user.tasks_solved = (user.tasks_solved or 0) + tasks_solved_inc
    db.session.commit()
