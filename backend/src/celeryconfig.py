from celery.schedules import crontab
from kombu import Queue

# Define queues
CELERY_TASK_QUEUES = (
    Queue("validation"),
    Queue("rating"),
    Queue("metrics"),
    Queue("notifications"),
)

CELERY_TASK_DEFAULT_QUEUE = "validation"
CELERY_TASK_ROUTES = {
    "src.tasks.validation_tasks.validate_submission": {"queue": "validation"},
    "src.tasks.rating_tasks.calculate_room_rating": {"queue": "rating"},
    "src.tasks.metrics_tasks.collect_daily_metrics": {"queue": "metrics"},
    "src.tasks.metrics_tasks.update_user_metrics": {"queue": "metrics"},
    "src.tasks.metrics_tasks.close_expired_tournaments": {"queue": "metrics"},
}

CELERY_BEAT_SCHEDULE = {
    "close-expired-tournaments-every-minute": {
        "task": "src.tasks.metrics_tasks.close_expired_tournaments",
        "schedule": crontab(minute="*"),
    },
}

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
