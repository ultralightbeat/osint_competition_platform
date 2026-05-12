from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...extensions import db
from ...models import Submission, Task, TaskLeaderboard, Room
from ...schemas import SubmissionSchema
from ...utils.validators import check_answer
from ...tasks.validation_tasks import validate_submission

submissions_bp = Blueprint("submissions", __name__)
MAX_HINTS_PER_TASK = 3
HINT_PENALTY_PERCENT_PER_HINT = 10
HINT_TIME_PENALTY_SECONDS = 10


def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

@submissions_bp.post("")
@jwt_required()
def submit_answer():
    data = request.get_json() or {}
    task_id = data.get("task_id")
    
    # Check if task exists and is open
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    if not task.is_open():
        return jsonify({
            "error": "Task is not open",
            "status": task.get_status(),
        }), 400
    if getattr(task, "is_tournament", False) and getattr(task, "tournament_ended", False):
        return jsonify({
            "error": "Tournament is over",
            "status": "archived",
        }), 400
    
    user_id = get_jwt_identity()
    
    room_id = data.get("room_id")
    room = None
    if room_id:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404
        if str(user_id) not in [str(room.player1_id), str(room.player2_id)]:
            return jsonify({"error": "Only room players can submit"}), 403
        if room.winner_id:
            return jsonify({"error": "Room already finished"}), 409
        if room.status != "active":
            return jsonify({"error": "Room is not active"}), 409
    else:
        # Check if user already solved this task
        existing_solution = TaskLeaderboard.query.filter_by(
            user_id=user_id,
            task_id=task_id
        ).first()
        
        if existing_solution:
            return jsonify({
                "error": "You have already solved this task",
                "solved_at": existing_solution.solved_at.isoformat(),
            }), 400
    
    elapsed_time_spent = max(0, _safe_int(data.get("elapsed_time_spent", data.get("time_spent", 0)), 0))
    requested_hints_count = 0 if room_id else max(0, _safe_int(data.get("used_hints_count", 0), 0))
    available_hints_count = min(MAX_HINTS_PER_TASK, len(task.hints or []))
    used_hints_count = min(requested_hints_count, available_hints_count)
    penalty_percent = min(100, used_hints_count * HINT_PENALTY_PERCENT_PER_HINT)
    penalty_time_spent = used_hints_count * HINT_TIME_PENALTY_SECONDS
    final_time_spent = elapsed_time_spent + penalty_time_spent

    s = Submission(
        user_id=user_id,
        task_id=task_id,
        tournament_id=data.get("tournament_id"),
        room_id=room_id,
        answer=data.get("answer", ""),
        time_spent=final_time_spent,
        used_hints_count=used_hints_count,
        penalty_percent=penalty_percent,
        penalty_time_spent=penalty_time_spent,
    )
    db.session.add(s)
    db.session.commit()
    
    # Run validation synchronously for immediate feedback
    is_correct = validate_submission(str(s.id))
    
    # Refresh submission to get updated is_correct value
    db.session.refresh(s)
    
    result = SubmissionSchema().dump(s)
    result["is_correct"] = is_correct
    
    if is_correct:
        if room_id:
            db.session.refresh(room)
            result["room_status"] = room.status
            result["winner_id"] = str(room.winner_id) if room.winner_id else None
        else:
            # Get user's rank on leaderboard
            leaderboard_entry = TaskLeaderboard.query.filter_by(
                user_id=user_id,
                task_id=task_id
            ).first()
            
            if leaderboard_entry:
                # Calculate rank
                better_or_equal = TaskLeaderboard.query.filter_by(task_id=task_id)\
                    .filter(
                        db.or_(
                            TaskLeaderboard.time_spent < leaderboard_entry.time_spent,
                            db.and_(
                                TaskLeaderboard.time_spent == leaderboard_entry.time_spent,
                                TaskLeaderboard.solved_at < leaderboard_entry.solved_at
                            )
                        )
                    ).count()
                
                result["rank"] = better_or_equal + 1
                result["time_spent"] = leaderboard_entry.time_spent
    
    return jsonify(result), 201

@submissions_bp.get("/<id>")
def get_submission(id):
    s = Submission.query.get(id)
    if not s:
        return jsonify({"error": "Not found"}), 404
    return jsonify(SubmissionSchema().dump(s))

@submissions_bp.get("/task/<task_id>")
def get_task_submissions(task_id):
    items = Submission.query.filter_by(task_id=task_id).order_by(Submission.submitted_at.desc()).all()
    return jsonify(SubmissionSchema(many=True).dump(items))

@submissions_bp.get("/solved")
@jwt_required()
def get_solved_tasks():
    """Get list of task IDs that current user has solved"""
    user_id = get_jwt_identity()
    
    # Get all tasks where user has leaderboard entry (means solved)
    solved_entries = TaskLeaderboard.query.filter_by(user_id=user_id).all()
    solved_task_ids = [str(entry.task_id) for entry in solved_entries]
    
    return jsonify({
        "solved_tasks": solved_task_ids,
        "count": len(solved_task_ids)
    }), 200
