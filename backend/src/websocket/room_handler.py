from flask_socketio import join_room, leave_room


def register_room_events(socketio):
    @socketio.on("room:join")
    def on_join(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        join_room(f"room_{room_id}")
        socketio.emit("room:player_joined", {"room_id": room_id, "user_id": user_id}, to=f"room_{room_id}")

    @socketio.on("room:ready")
    def on_ready(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        socketio.emit("room:player_ready", {"room_id": room_id, "user_id": user_id}, to=f"room_{room_id}")

    @socketio.on("room:submit")
    def on_submit(data):
        # submission handled by HTTP, this is for quick feedback
        room_id = data.get("room_id")
        socketio.emit("room:score_update", {"room_id": room_id}, to=f"room_{room_id}")

    @socketio.on("room:leave")
    def on_leave(data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        leave_room(f"room_{room_id}")
        socketio.emit("room:player_left", {"room_id": room_id, "user_id": user_id}, to=f"room_{room_id}")

    @socketio.on("matchmaking:start")
    def on_matchmaking_start(data):
        socketio.emit("matchmaking:start", data)

    @socketio.on("matchmaking:cancel")
    def on_matchmaking_cancel(data):
        socketio.emit("matchmaking:cancel", data)
