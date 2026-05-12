from ..celery_app import celery
from ..extensions import socketio

@celery.task
def notify_room_task_solved(room_id: str, user_id: str, task_id: str):
    socketio.emit("room:task_solved", {"room_id": room_id, "user_id": user_id, "task_id": task_id}, to=f"room_{room_id}")
