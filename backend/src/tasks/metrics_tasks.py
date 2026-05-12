from datetime import date, datetime
from ..celery_app import celery
from ..extensions import db
from ..models import PlatformMetrics, UserMetrics, Submission, Task, Tournament, Room, User

@celery.task
def collect_daily_metrics():
    today = date.today()
    metrics = PlatformMetrics.query.filter_by(date=today).first()
    if not metrics:
        metrics = PlatformMetrics(date=today)
        db.session.add(metrics)

    # Example counts (simplified)
    metrics.tasks_created = Task.query.filter(Task.created_at >= today).count()
    metrics.tournaments_created = Tournament.query.filter(Tournament.created_at >= today).count()
    metrics.rooms_played = Room.query.filter(Room.finished_at != None).count()
    metrics.total_submissions = Submission.query.filter(Submission.submitted_at >= today).count()
    metrics.correct_submissions = Submission.query.filter(Submission.submitted_at >= today, Submission.is_correct == True).count()

    db.session.commit()

@celery.task
def update_user_metrics(user_id: str, task_id: str, time_spent: int, is_correct: bool):
    today = date.today()
    metrics = UserMetrics.query.filter_by(user_id=user_id, date=today).first()
    if not metrics:
        metrics = UserMetrics(user_id=user_id, date=today)
        db.session.add(metrics)

    metrics.tasks_attempted += 1
    metrics.time_spent += int(time_spent or 0)

    if is_correct:
        from ..models import Task
        task = Task.query.get(task_id)
        metrics.tasks_solved += 1
        if task:
            if task.task_type == "text":
                metrics.text_tasks_solved += 1
            elif task.task_type == "image_search":
                metrics.image_tasks_solved += 1
            elif task.task_type == "social_media":
                metrics.social_tasks_solved += 1
            # by difficulty
            field = f"{task.difficulty}_solved"
            if hasattr(metrics, field):
                setattr(metrics, field, getattr(metrics, field) + 1)
    db.session.commit()


@celery.task
def close_expired_tournaments():
    now = datetime.utcnow()
    updated = Task.query.filter(
        Task.is_tournament.is_(True),
        Task.tournament_ended.is_(False),
        Task.close_at.isnot(None),
        Task.close_at <= now,
    ).update({"tournament_ended": True}, synchronize_session=False)
    if updated:
        db.session.commit()
    return updated
