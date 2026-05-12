from .room_handler import register_room_events
from .tournament_handler import register_tournament_events
from .notification_handler import register_notification_events


def register_socketio_handlers(socketio):
    register_room_events(socketio)
    register_tournament_events(socketio)
    register_notification_events(socketio)
