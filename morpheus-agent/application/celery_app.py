"""
Celery Task Queue Configuration
Enables asynchronous job processing via Redis broker for Morpheus Agent.
"""

import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "morpheus_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["application.scheduler"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    beat_schedule={
        "process-scheduled-posts-every-minute": {
            "task": "application.scheduler.celery_process_posts",
            "schedule": 60.0
        },
        "auto-refresh-tokens-hourly": {
            "task": "application.scheduler.celery_refresh_tokens",
            "schedule": 3600.0
        }
    }
)
