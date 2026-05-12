def register_tournament_events(socketio):
    def emit_update(event, payload):
        socketio.emit(event, payload)

    # Example: call emit_update from backend jobs
