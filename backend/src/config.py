import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///osint.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000"))

    REDIS_URL = os.getenv("REDIS_URL", "")
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

    CELERY_BROKER_URL = RABBITMQ_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # SocketIO
    SOCKETIO_MESSAGE_QUEUE = REDIS_URL

    # S3 object storage (AWS S3 / Beget S3 compatible)
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "")
    S3_REGION = os.getenv("S3_REGION", "")
    S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")
    S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID", "")
    S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY", "")
    S3_PRESIGNED_UPLOAD_TTL = int(os.getenv("S3_PRESIGNED_UPLOAD_TTL", "600"))
    S3_PRESIGNED_GET_TTL = int(os.getenv("S3_PRESIGNED_GET_TTL", "300"))
    TASK_IMAGE_MAX_SIZE_BYTES = int(os.getenv("TASK_IMAGE_MAX_SIZE_BYTES", str(10 * 1024 * 1024)))
    TASK_IMAGE_MAX_FILES = int(os.getenv("TASK_IMAGE_MAX_FILES", "3"))
