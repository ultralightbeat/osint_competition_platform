import os
from flask import Flask, jsonify
from .config import Config
from .extensions import db, migrate, jwt, cors, socketio
from .websocket import register_socketio_handlers

from .api.auth.routes import auth_bp
from .api.users.routes import users_bp
from .api.tournaments.routes import tournaments_bp
from .api.tasks.routes import tasks_bp
from .api.rooms.routes import rooms_bp
from .api.submissions.routes import submissions_bp
from .api.ratings.routes import ratings_bp
from .api.metrics.routes import metrics_bp


def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    db.init_app(app)
    # Ensure Flask-Migrate uses the backend/migrations directory regardless of CWD
    base_dir = os.path.dirname(os.path.dirname(__file__))
    migrations_dir = os.path.join(base_dir, "migrations")
    migrate.init_app(app, db, directory=migrations_dir)
    jwt.init_app(app)
    cors.init_app(app, resources={r"*": {"origins": "*"}})
    mq = app.config.get("REDIS_URL") or None
    socketio.init_app(app, cors_allowed_origins="*", message_queue=mq)
    register_socketio_handlers(socketio)

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(tournaments_bp, url_prefix="/api/tournaments")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(rooms_bp, url_prefix="/api/rooms")
    app.register_blueprint(submissions_bp, url_prefix="/api/submissions")
    app.register_blueprint(ratings_bp, url_prefix="/api/ratings")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app
