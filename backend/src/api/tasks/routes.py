from datetime import datetime, timezone
from uuid import uuid4
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...extensions import db
from ...models import (
    Task,
    TaskHint,
    TaskTag,
    Submission,
    TaskLeaderboard,
    Room,
    RoomTask,
    TournamentTask,
)
from ...schemas import TaskSchema
from ...services.s3_service import (
    create_presigned_get_url,
    create_presigned_post,
    delete_object_if_exists,
    is_s3_configured,
    object_exists,
)


tasks_bp = Blueprint("tasks", __name__)

ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _parse_optional_datetime(value, field_name):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        candidate = value.strip()
        if not candidate:
            return None
        candidate = candidate.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(candidate)
        except ValueError:
            raise ValueError(f"{field_name} must be a valid ISO datetime")
        if parsed.tzinfo is not None:
            return parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    raise ValueError(f"{field_name} must be a datetime string")


def _collect_image_keys_from_content(content):
    if not isinstance(content, dict):
        return []
    images = content.get("images")
    if isinstance(images, list):
        keys = []
        for image in images:
            if isinstance(image, dict) and isinstance(image.get("key"), str):
                keys.append(image["key"])
        return keys
    image = content.get("image")
    if isinstance(image, dict) and isinstance(image.get("key"), str):
        return [image["key"]]
    return []


def _resolve_content_images(content):
    if not isinstance(content, dict):
        return {}

    if "image_url" in content and "images" not in content and "image" not in content:
        return content

    resolved = dict(content)
    images = resolved.get("images")
    if isinstance(images, list):
        prepared_images = []
        for image in images:
            if not isinstance(image, dict):
                continue
            key = image.get("key")
            if not isinstance(key, str) or not key.strip():
                continue
            prepared = dict(image)
            if is_s3_configured():
                prepared["url"] = create_presigned_get_url(key)
            prepared_images.append(prepared)
        prepared_images = prepared_images[: current_app.config["TASK_IMAGE_MAX_FILES"]]
        resolved["images"] = prepared_images
        resolved["image_urls"] = [item.get("url") for item in prepared_images if item.get("url")]
        if resolved["image_urls"]:
            resolved["image_url"] = resolved["image_urls"][0]
        return resolved

    image = resolved.get("image")
    if isinstance(image, dict):
        key = image.get("key")
        if isinstance(key, str) and key.strip():
            legacy_image = dict(image)
            if is_s3_configured():
                legacy_image["url"] = create_presigned_get_url(key)
                resolved["image_url"] = legacy_image["url"]
            resolved["image"] = legacy_image
            return resolved

    return resolved


def _with_resolved_image_url(task: Task):
    payload = TaskSchema().dump(task)
    payload["content"] = _resolve_content_images(payload.get("content"))
    return payload


def _with_resolved_image_urls(tasks):
    return [_with_resolved_image_url(task) for task in tasks]


def _to_utc_iso(dt):
    if not dt:
        return None
    return f"{dt.isoformat()}Z"


@tasks_bp.get("")
def list_tasks():
    items = Task.query.order_by(Task.created_at.desc()).all()
    return jsonify(_with_resolved_image_urls(items))


@tasks_bp.post("")
@jwt_required()
def create_task():
    data = request.get_json() or {}
    raw_hints = data.get("hints") or []
    raw_tags = data.get("tags") or []
    if not isinstance(raw_hints, list):
        raw_hints = []
    if not isinstance(raw_tags, list):
        raw_tags = []
    filtered_hints = [str(hint).strip() for hint in raw_hints if str(hint).strip()][:3]
    filtered_tags = []
    for tag in raw_tags:
        value = str(tag).strip()
        if value and value not in filtered_tags:
            filtered_tags.append(value)

    content = data.get("content", {})
    if not isinstance(content, dict):
        return jsonify({"error": "content must be an object"}), 400

    image_keys = _collect_image_keys_from_content(content)
    task_type = data.get("task_type", "text")
    if task_type == "image_search" and len(image_keys) == 0:
        return jsonify({"error": "At least one image is required for image task"}), 400
    if len(image_keys) > current_app.config["TASK_IMAGE_MAX_FILES"]:
        return jsonify({"error": f"Maximum {current_app.config['TASK_IMAGE_MAX_FILES']} images per task"}), 400
    for image_key in image_keys:
        if not is_s3_configured():
            return jsonify({"error": "S3 storage is not configured"}), 500
        if not object_exists(image_key):
            return jsonify({"error": "Uploaded image not found in storage"}), 400

    is_tournament = _to_bool(data.get("is_tournament", False))
    try:
        open_at = _parse_optional_datetime(data.get("open_at"), "open_at")
        close_at = _parse_optional_datetime(data.get("close_at"), "close_at")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if is_tournament:
        if close_at is None:
            return jsonify({"error": "close_at is required for tournament task"}), 400
        if close_at <= datetime.utcnow():
            return jsonify({"error": "Tournament end time must be in the future"}), 400

    t = Task(
        title=data.get("title"),
        description=data.get("description"),
        author_id=get_jwt_identity(),
        task_type=data.get("task_type", "text"),
        difficulty=data.get("difficulty", "easy"),
        points=data.get("points", 100),
        content=content,
        correct_answer=data.get("correct_answer", ""),
        answer_regex=data.get("answer_regex"),
        case_sensitive=data.get("case_sensitive", False),
        is_tournament=is_tournament,
        tournament_ended=False,
        open_at=open_at,
        close_at=close_at,
    )
    db.session.add(t)
    db.session.flush()

    for index, hint_text in enumerate(filtered_hints, start=1):
        db.session.add(TaskHint(task_id=t.id, hint_order=index, text=hint_text))
    for tag in filtered_tags:
        db.session.add(TaskTag(task_id=t.id, tag=tag))

    db.session.commit()
    return jsonify(_with_resolved_image_url(t)), 201


@tasks_bp.get("/<id>")
def get_task(id):
    t = Task.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_with_resolved_image_url(t))


@tasks_bp.get("/<id>/edit-data")
@jwt_required()
def get_task_for_edit(id):
    t = Task.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    user_id = get_jwt_identity()
    if str(t.author_id) != str(user_id):
        return jsonify({"error": "You can edit only your own tasks"}), 403
    payload = _with_resolved_image_url(t)
    payload["correct_answer"] = t.correct_answer
    return jsonify(payload)


@tasks_bp.put("/<id>")
@jwt_required()
def update_task(id):
    t = Task.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    user_id = get_jwt_identity()
    if str(t.author_id) != str(user_id):
        return jsonify({"error": "You can edit only your own tasks"}), 403
    data = request.get_json() or {}
    old_content = t.content if isinstance(t.content, dict) else {}
    next_is_tournament = _to_bool(data["is_tournament"]) if "is_tournament" in data else t.is_tournament
    try:
        next_open_at = _parse_optional_datetime(data["open_at"], "open_at") if "open_at" in data else t.open_at
        next_close_at = _parse_optional_datetime(data["close_at"], "close_at") if "close_at" in data else t.close_at
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if next_is_tournament:
        if next_close_at is None:
            return jsonify({"error": "close_at is required for tournament task"}), 400
        if next_close_at <= datetime.utcnow():
            return jsonify({"error": "Tournament end time must be in the future"}), 400
    else:
        data["tournament_ended"] = False

    if "content" in data:
        content = data.get("content")
        if not isinstance(content, dict):
            return jsonify({"error": "content must be an object"}), 400
        image_keys = _collect_image_keys_from_content(content)
        next_task_type = data.get("task_type", t.task_type)
        if next_task_type == "image_search" and len(image_keys) == 0:
            return jsonify({"error": "At least one image is required for image task"}), 400
        if len(image_keys) > current_app.config["TASK_IMAGE_MAX_FILES"]:
            return jsonify({"error": f"Maximum {current_app.config['TASK_IMAGE_MAX_FILES']} images per task"}), 400
        for image_key in image_keys:
            if not is_s3_configured():
                return jsonify({"error": "S3 storage is not configured"}), 500
            if not object_exists(image_key):
                return jsonify({"error": "Uploaded image not found in storage"}), 400

    data["open_at"] = next_open_at
    data["close_at"] = next_close_at
    data["is_tournament"] = next_is_tournament

    for field in [
        "title",
        "description",
        "task_type",
        "difficulty",
        "points",
        "content",
        "correct_answer",
        "answer_regex",
        "case_sensitive",
        "is_approved",
        "is_public",
        "is_tournament",
        "tournament_ended",
        "open_at",
        "close_at",
    ]:
        if field in data:
            setattr(t, field, data[field])
    if "tags" in data:
        raw_tags = data.get("tags") or []
        if not isinstance(raw_tags, list):
            raw_tags = []
        filtered_tags = []
        for tag in raw_tags:
            value = str(tag).strip()
            if value and value not in filtered_tags:
                filtered_tags.append(value)
        TaskTag.query.filter_by(task_id=t.id).delete()
        for tag in filtered_tags:
            db.session.add(TaskTag(task_id=t.id, tag=tag))

    current_image_keys = _collect_image_keys_from_content(t.content if isinstance(t.content, dict) else {})
    if t.task_type == "image_search" and len(current_image_keys) == 0:
        return jsonify({"error": "At least one image is required for image task"}), 400

    db.session.commit()

    old_keys = set(_collect_image_keys_from_content(old_content))
    new_keys = set(_collect_image_keys_from_content(t.content if isinstance(t.content, dict) else {}))
    for image_key in old_keys - new_keys:
        delete_object_if_exists(image_key)

    return jsonify(_with_resolved_image_url(t))


@tasks_bp.delete("/<id>")
@jwt_required()
def delete_task(id):
    t = Task.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404
    user_id = get_jwt_identity()
    if str(t.author_id) != str(user_id):
        return jsonify({"error": "You can delete only your own tasks"}), 403
    image_keys = _collect_image_keys_from_content(t.content if isinstance(t.content, dict) else {})

    TaskTag.query.filter_by(task_id=t.id).delete(synchronize_session=False)
    TaskHint.query.filter_by(task_id=t.id).delete(synchronize_session=False)
    TaskLeaderboard.query.filter_by(task_id=t.id).delete(synchronize_session=False)
    Submission.query.filter_by(task_id=t.id).delete(synchronize_session=False)
    TournamentTask.query.filter_by(task_id=t.id).delete(synchronize_session=False)
    RoomTask.query.filter_by(task_id=t.id).delete(synchronize_session=False)
    Room.query.filter_by(selected_task_id=t.id).update({"selected_task_id": None}, synchronize_session=False)

    db.session.delete(t)
    db.session.commit()
    for image_key in image_keys:
        delete_object_if_exists(image_key)
    return jsonify({"status": "deleted"})


@tasks_bp.get("/types")
def task_types():
    return jsonify(["text", "image_search", "social_media"])


@tasks_bp.get("/difficulties")
def difficulties():
    return jsonify(["easy", "medium", "hard", "expert"])


@tasks_bp.get("/random")
def random_task():
    t = Task.query.order_by(db.func.random()).first()
    if not t:
        return jsonify({"error": "No tasks"}), 404
    return jsonify(_with_resolved_image_url(t))


@tasks_bp.post("/image/upload-url")
@jwt_required()
def get_task_image_upload_url():
    if not is_s3_configured():
        return jsonify({"error": "S3 storage is not configured"}), 500

    data = request.get_json() or {}
    filename = str(data.get("filename") or "").strip()
    content_type = str(data.get("content_type") or "").strip().lower()
    size = data.get("size")
    task_id = str(data.get("task_id") or "new").strip()

    if not filename:
        return jsonify({"error": "filename is required"}), 400
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        return jsonify({"error": "Unsupported image type"}), 400
    if not isinstance(size, int) or size <= 0:
        return jsonify({"error": "size must be a positive integer"}), 400
    if size > current_app.config["TASK_IMAGE_MAX_SIZE_BYTES"]:
        return jsonify({"error": "Image is too large"}), 400

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({"error": "Unsupported image extension"}), 400

    object_key = f"tasks/{task_id}/{uuid4()}.{extension}"
    post_data = create_presigned_post(object_key)
    return jsonify(
        {
            "method": "POST",
            "upload_url": post_data.get("url"),
            "fields": post_data.get("fields", {}),
            "key": object_key,
        }
    )


@tasks_bp.get("/<id>/leaderboard")
def task_leaderboard(id):
    from ...models import TaskLeaderboard, User
    t = Task.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404

    entries = TaskLeaderboard.query\
        .filter_by(task_id=id)\
        .order_by(TaskLeaderboard.time_spent.asc(), TaskLeaderboard.solved_at.asc())\
        .all()

    user_ids = [str(entry.user_id) for entry in entries]
    users = User.query.filter(db.cast(User.id, db.String).in_(user_ids)).all() if user_ids else []
    user_map = {str(user.id): user for user in users}

    result = []
    for rank, entry in enumerate(entries, start=1):
        user = user_map.get(str(entry.user_id))
        result.append({
            "rank": rank,
            "user_id": str(entry.user_id),
            "username": user.username if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
            "user": {
                "username": user.username if user else "Unknown",
                "avatar_url": user.avatar_url if user else None,
            },
            "solved_at": entry.solved_at.isoformat(),
            "time_spent": entry.time_spent,
        })

    return jsonify(result)


@tasks_bp.get("/<id>/status")
def task_status(id):
    t = Task.query.get(id)
    if not t:
        return jsonify({"error": "Not found"}), 404

    return jsonify({
        "status": t.get_status(),
        "is_open": t.is_open(),
        "open_at": _to_utc_iso(t.open_at),
        "close_at": _to_utc_iso(t.close_at),
    })
