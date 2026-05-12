from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import bcrypt
from datetime import datetime
from ...extensions import db
from ...models import User

auth_bp = Blueprint("auth", __name__)


def safe_hash_password(password):
    """Hash password with bcrypt, truncating to 72 bytes if necessary"""
    # bcrypt has a 72 byte limit, truncate to avoid errors
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    
    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "User exists"}), 409
    
    has_admin = User.query.filter_by(is_admin=True).first() is not None

    user = User(
        username=username,
        email=email,
        password_hash=safe_hash_password(password),
        is_admin=not has_admin,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"id": str(user.id), "username": user.username}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400
    
    # Allow login with username or email
    user = User.query.filter((User.username == username) | (User.email == username)).first()
    
    if not user or not user.password_hash:
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Truncate password to 72 bytes for bcrypt verification
    password_bytes = password.encode('utf-8')[:72]
    
    # bcrypt.checkpw expects bytes for both password and hash
    stored_hash = user.password_hash.encode('utf-8') if isinstance(user.password_hash, str) else user.password_hash
    
    if not bcrypt.checkpw(password_bytes, stored_hash):
        return jsonify({"error": "Invalid credentials"}), 401
    
    user.last_login = datetime.utcnow()
    db.session.commit()

    access = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    return jsonify({"access_token": access, "refresh_token": refresh})


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access = create_access_token(identity=identity)
    return jsonify({"access_token": access})


@auth_bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"status": "logged_out"})


@auth_bp.post("/password/change")
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    data = request.get_json() or {}
    
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    
    if not old_password or not new_password:
        return jsonify({"error": "Missing passwords"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
    
    # Verify old password
    old_password_bytes = old_password.encode('utf-8')[:72]
    stored_hash = user.password_hash.encode('utf-8') if isinstance(user.password_hash, str) else user.password_hash
    
    if not user.password_hash or not bcrypt.checkpw(old_password_bytes, stored_hash):
        return jsonify({"error": "Invalid password"}), 400
    
    user.password_hash = safe_hash_password(new_password)
    db.session.commit()
    return jsonify({"status": "changed"})
