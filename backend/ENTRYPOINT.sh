#!/usr/bin/env bash
set -euo pipefail

export PYTHONPATH=/app

# Database migrations
flask db upgrade

# Run with Gunicorn and eventlet for WebSocket support
exec gunicorn -w 1 -k eventlet -b 0.0.0.0:5000 src.wsgi:app
