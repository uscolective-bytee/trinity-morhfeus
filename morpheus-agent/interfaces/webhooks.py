"""
Inbound Webhooks Interface
Meta, X, LinkedIn, YouTube, TikTok.
"""

import os
import hmac
import hashlib
import json
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException, Query, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database import get_db
from domain.models import SocialInteractionRecord
from application.scheduler import autopilot_engine
from core.logging import logger

router = APIRouter(prefix="/api/v1/webhooks", tags=["Social Webhooks Engine"])

META_VERIFY_TOKEN = os.getenv("META_WEBHOOK_VERIFY_TOKEN", "trinity_meta_secret_verify_token")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
X_CONSUMER_SECRET = os.getenv("X_CLIENT_SECRET", "")


@router.get("/meta")
async def meta_webhook_verification(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@router.post("/meta")
async def meta_webhook_event(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    body_bytes = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    if META_APP_SECRET and signature:
        expected = "sha256=" + hmac.new(META_APP_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=401, detail="Invalid Meta signature")

    payload = json.loads(body_bytes.decode("utf-8"))
    entries = payload.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for ch in changes:
            val = ch.get("value", {})
            if ch.get("field") == "comments":
                comment_id = val.get("comment_id")
                from_user = val.get("from", {})
                text = val.get("message", "")
                
                interaction = SocialInteractionRecord(
                    id=f"meta_comment_{comment_id}",
                    platform="meta",
                    account_id=f"meta:{entry.get('id')}",
                    interaction_type="comment",
                    sender_id=str(from_user.get("id")),
                    sender_username=from_user.get("name"),
                    message_content=text,
                    status="pending"
                )
                db.add(interaction)
                await db.commit()
                background_tasks.add_task(autopilot_engine.handle_interaction, interaction.id)

    return {"status": "received"}


@router.get("/x")
async def x_crc_challenge(crc_token: Optional[str] = None):
    if not crc_token:
        raise HTTPException(status_code=400, detail="Missing crc_token")

    sha256_hash = hmac.new(
        X_CONSUMER_SECRET.encode("utf-8"),
        msg=crc_token.encode("utf-8"),
        digestmod=hashlib.sha256
    ).digest()
    response_token = "sha256=" + hashlib.sha256(sha256_hash).hexdigest()
    return {"response_token": response_token}


@router.post("/x")
async def x_webhook_events(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    payload = await request.json()
    dm_events = payload.get("direct_message_events", [])
    for dm in dm_events:
        msg_data = dm.get("message_create", {})
        sender_id = msg_data.get("sender_id")
        text = msg_data.get("message_data", {}).get("text", "")
        
        interaction = SocialInteractionRecord(
            id=f"x_dm_{dm.get('id')}",
            platform="x",
            account_id=f"x:{payload.get('for_user_id')}",
            interaction_type="dm",
            sender_id=str(sender_id),
            message_content=text,
            status="pending"
        )
        db.add(interaction)
        await db.commit()
        background_tasks.add_task(autopilot_engine.handle_interaction, interaction.id)

    return {"status": "received"}
