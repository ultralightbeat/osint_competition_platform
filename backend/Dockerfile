FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY src /app/src
COPY migrations /app/migrations
COPY ENTRYPOINT.sh /app/ENTRYPOINT.sh
RUN chmod +x /app/ENTRYPOINT.sh

ENV FLASK_APP=src/app.py \
    FLASK_ENV=production

EXPOSE 5000

CMD ["/app/ENTRYPOINT.sh"]