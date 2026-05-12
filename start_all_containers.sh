#!/usr/bin/env bash
set -euo pipefail

echo "Building and starting OSINT Competition Platform..."
docker compose up -d --build
echo "Done. Visit http://localhost"
