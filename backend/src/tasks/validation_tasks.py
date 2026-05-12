from ..celery_app import celery
from ..extensions import db
from ..models import Submission, Task, Room, User, TaskLeaderboard, RatingHistory
from ..utils.validators import check_answer
from .notification_tasks import notify_room_task_solved
from ..services.user_service import update_stats
from ..services.rank_service import get_rank_by_rating

@celery.task
def validate_submission(submission_id: str):
    submission = Submission.query.get(submission_id)
    if not submission:
        return False
    task = Task.query.get(submission.task_id)
    if not task:
        return False

    # Check if task is open
    if not task.is_open():
        submission.is_correct = False
        db.session.commit()
        return False

    is_correct = check_answer(submission.answer, task)
    submission.is_correct = is_correct

    if submission.room_id:
        room = Room.query.get(submission.room_id)
        if not room or room.status != "active":
            db.session.commit()
            return False

        if is_correct and not room.winner_id:
            room.winner_id = submission.user_id
            if room.player1_id and str(room.player1_id) == str(submission.user_id):
                room.player1_score = (room.player1_score or 0) + 1
            if room.player2_id and str(room.player2_id) == str(submission.user_id):
                room.player2_score = (room.player2_score or 0) + 1
            notify_room_task_solved.delay(submission.room_id, submission.user_id, submission.task_id)

        db.session.commit()
        return is_correct

    if is_correct:
        # Check if user already solved this task
        existing_solution = TaskLeaderboard.query.filter_by(
            user_id=submission.user_id,
            task_id=submission.task_id
        ).first()
        
        # Only record first solve in leaderboard and award points
        if not existing_solution:
            leaderboard_entry = TaskLeaderboard(
                user_id=submission.user_id,
                task_id=submission.task_id,
                time_spent=submission.time_spent or 0,
            )
            db.session.add(leaderboard_entry)
            
            # Award task points to user rating
            user = User.query.get(submission.user_id)
            if user:
                base_points = task.points or 0
                penalty_percent = max(0, min(100, submission.penalty_percent or 0))
                awarded_points = int(round(base_points * ((100 - penalty_percent) / 100)))
                old_rating = user.rating or 0
                new_rating = old_rating + awarded_points
                user.rating = new_rating
                user.rank = get_rank_by_rating(new_rating)
                
                # Log rating change
                rating_history = RatingHistory(
                    user_id=submission.user_id,
                    old_rating=old_rating,
                    new_rating=new_rating,
                    change=awarded_points,
                    source_type='task',
                    source_id=submission.task_id
                )
                db.session.add(rating_history)
            update_stats(submission.user_id, tasks_solved_inc=1)
            task.times_solved = (task.times_solved or 0) + 1
    task.times_attempted = (task.times_attempted or 0) + 1
    db.session.commit()
    return is_correct
