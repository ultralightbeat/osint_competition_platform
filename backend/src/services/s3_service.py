from __future__ import annotations

from typing import Optional
import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from flask import current_app


_s3_client = None


def _build_s3_client():
    cfg = current_app.config
    params = {
        "service_name": "s3",
        "region_name": cfg.get("S3_REGION") or None,
        "aws_access_key_id": cfg.get("S3_ACCESS_KEY_ID") or None,
        "aws_secret_access_key": cfg.get("S3_SECRET_ACCESS_KEY") or None,
        "endpoint_url": cfg.get("S3_ENDPOINT_URL") or None,
        "config": BotoConfig(signature_version="s3v4"),
    }
    return boto3.client(**params)


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = _build_s3_client()
    return _s3_client


def is_s3_configured() -> bool:
    cfg = current_app.config
    return bool(cfg.get("S3_BUCKET_NAME"))


def create_presigned_put_url(key: str, content_type: str) -> str:
    if not is_s3_configured():
        raise RuntimeError("S3 is not configured")
    client = get_s3_client()
    return client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": current_app.config["S3_BUCKET_NAME"],
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=current_app.config["S3_PRESIGNED_UPLOAD_TTL"],
    )


def create_presigned_post(key: str) -> dict:
    if not is_s3_configured():
        raise RuntimeError("S3 is not configured")
    client = get_s3_client()
    return client.generate_presigned_post(
        Bucket=current_app.config["S3_BUCKET_NAME"],
        Key=key,
        ExpiresIn=current_app.config["S3_PRESIGNED_UPLOAD_TTL"],
    )


def create_presigned_get_url(key: str) -> str:
    if not is_s3_configured():
        raise RuntimeError("S3 is not configured")
    client = get_s3_client()
    return client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": current_app.config["S3_BUCKET_NAME"],
            "Key": key,
        },
        ExpiresIn=current_app.config["S3_PRESIGNED_GET_TTL"],
    )


def object_exists(key: str) -> bool:
    if not is_s3_configured():
        return False
    client = get_s3_client()
    try:
        client.head_object(Bucket=current_app.config["S3_BUCKET_NAME"], Key=key)
        return True
    except ClientError:
        return False


def delete_object_if_exists(key: Optional[str]) -> None:
    if not key or not is_s3_configured():
        return
    client = get_s3_client()
    try:
        client.delete_object(Bucket=current_app.config["S3_BUCKET_NAME"], Key=key)
    except ClientError:
        return
