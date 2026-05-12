import os
from celery import Celery

celery = Celery(
    "osint_platform",
    broker=os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    include=[
        "src.tasks.validation_tasks",
        "src.tasks.rating_tasks",
        "src.tasks.metrics_tasks",
        "src.tasks.notification_tasks",
    ],
)

celery.config_from_object("src.celeryconfig")
