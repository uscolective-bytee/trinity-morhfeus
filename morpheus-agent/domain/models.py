"""
Domain Entities and Database Models
Uses timezone-aware UTC datetimes and clean relationships.
"""

import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
from core.security import vault

Base = declarative_base()


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String(64), primary_key=True)  # e.g. "meta:page_id", "x:user_id"
    platform = Column(String(32), nullable=False, index=True)  # meta, x, linkedin, youtube, tiktok
    external_account_id = Column(String(128), nullable=False)
    username = Column(String(128), nullable=True)
    display_name = Column(String(255), nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    status = Column(String(32), default="active")  # active, expired, error, disconnected
    autopilot_enabled = Column(Boolean, default=True)  # Full autonomous mode
    permissions_json = Column(JSON, default=list)  # ["read", "write", "edit", "admin"]
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    token = relationship("OAuthTokenRecord", back_populates="account", uselist=False, cascade="all, delete-orphan")
    posts = relationship("PostRecord", back_populates="account", cascade="all, delete-orphan")


class OAuthTokenRecord(Base):
    __tablename__ = "oauth_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(String(64), ForeignKey("social_accounts.id"), unique=True, nullable=False)
    encrypted_access_token = Column(Text, nullable=False)
    encrypted_refresh_token = Column(Text, nullable=True)
    token_type = Column(String(32), default="Bearer")
    scopes = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_valid = Column(Boolean, default=True)
    last_refreshed_at = Column(DateTime(timezone=True), default=utc_now)

    account = relationship("SocialAccount", back_populates="token")

    @property
    def access_token(self) -> str:
        return vault.decrypt(self.encrypted_access_token)

    @access_token.setter
    def access_token(self, val: str):
        self.encrypted_access_token = vault.encrypt(val)

    @property
    def refresh_token(self) -> str:
        return vault.decrypt(self.encrypted_refresh_token) if self.encrypted_refresh_token else ""

    @refresh_token.setter
    def refresh_token(self, val: str):
        self.encrypted_refresh_token = vault.encrypt(val) if val else None


class PostRecord(Base):
    __tablename__ = "social_posts"

    id = Column(String(64), primary_key=True)
    account_id = Column(String(64), ForeignKey("social_accounts.id"), nullable=False, index=True)
    platform = Column(String(32), nullable=False)
    content_text = Column(Text, nullable=False)
    media_urls = Column(JSON, default=list)
    shortened_urls = Column(JSON, default=list)
    status = Column(String(32), default="draft", index=True)  # draft, scheduled, published, failed
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    external_post_id = Column(String(128), nullable=True)
    error_message = Column(Text, nullable=True)
    ai_generated = Column(Boolean, default=True)
    ai_prompt = Column(Text, nullable=True)
    metrics = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    account = relationship("SocialAccount", back_populates="posts")


class SocialInteractionRecord(Base):
    __tablename__ = "social_interactions"

    id = Column(String(64), primary_key=True)
    platform = Column(String(32), nullable=False, index=True)
    account_id = Column(String(64), nullable=False)
    interaction_type = Column(String(32), nullable=False)  # dm, comment, mention
    sender_id = Column(String(128), nullable=False)
    sender_username = Column(String(128), nullable=True)
    message_content = Column(Text, nullable=False)
    reply_content = Column(Text, nullable=True)
    status = Column(String(32), default="pending", index=True)  # pending, replied, ignored_spam, error
    sentiment = Column(String(32), nullable=True)  # positive, neutral, negative, spam
    replied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ShortenedLink(Base):
    __tablename__ = "shortened_links"

    code = Column(String(32), primary_key=True)
    target_url = Column(Text, nullable=False)
    campaign = Column(String(128), nullable=True)
    clicks = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_clicked_at = Column(DateTime(timezone=True), nullable=True)


class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(64), nullable=False, index=True)
    platform = Column(String(32), nullable=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
