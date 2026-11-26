"""
Domain Pydantic Schemas
Strict input and output validation for Morpheus API.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ShortenRequestSchema(BaseModel):
    target_url: str
    custom_code: Optional[str] = None
    campaign: Optional[str] = "morpheus_autopilot"


class PostCreateSchema(BaseModel):
    platform: str
    topic: str
    media_url: Optional[str] = None
    target_link: Optional[str] = None
    schedule_minutes_from_now: int = 0


class ConnectionStatusSchema(BaseModel):
    platform: str
    account_id: Optional[str]
    username: Optional[str]
    display_name: Optional[str]
    avatar: Optional[str]
    status: str
    autopilot_enabled: bool
    permissions: List[str]
    token_valid: bool
    expires_at: Optional[str]
    last_refreshed_at: Optional[str]
