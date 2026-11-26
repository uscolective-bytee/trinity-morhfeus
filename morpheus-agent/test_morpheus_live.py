"""
Comprehensive Live Verification Test Suite for Morpheus Agent (Clean Architecture)
Target Domain: aura.dev
"""

import pytest
import datetime
from httpx import AsyncClient, ASGITransport

from core.security import CryptoVault, vault
from core.config import DomainSettings, DomainManager
from core.guardrails import guardrails
from infrastructure.database import init_db, AsyncSessionLocal
from domain.models import SocialAccount, OAuthTokenRecord, ShortenedLink, PostRecord
from main import app


@pytest.mark.asyncio
async def test_crypto_vault():
    test_token = "trn_live_oauth_access_token_aura_dev_1234567890_secret"
    encrypted = vault.encrypt(test_token)
    assert encrypted != test_token
    assert len(encrypted) > len(test_token)
    decrypted = vault.decrypt(encrypted)
    assert decrypted == test_token


@pytest.mark.asyncio
async def test_domain_config_and_dns():
    settings = DomainSettings(
        primary_domain="aura.dev",
        subdomain="morpheus",
        server_public_ip="1.2.3.4"
    )
    manager = DomainManager(settings)

    assert settings.full_host == "morpheus.aura.dev"
    assert settings.base_url == "https://morpheus.aura.dev"
    assert settings.oauth_callbacks["meta"] == "https://morpheus.aura.dev/api/v1/auth/meta/callback"
    assert settings.oauth_callbacks["x"] == "https://morpheus.aura.dev/api/v1/auth/x/callback"
    assert settings.oauth_callbacks["linkedin"] == "https://morpheus.aura.dev/api/v1/auth/linkedin/callback"

    records = manager.get_required_dns_records()
    rec_names = [r.name for r in records]
    assert "morpheus" in rec_names
    assert "_facebook-domain-verification.aura.dev" in rec_names


@pytest.mark.asyncio
async def test_database_and_models():
    await init_db()

    async with AsyncSessionLocal() as session:
        account_id = "test_meta:page_aura_999"
        acc = SocialAccount(
            id=account_id,
            platform="meta",
            external_account_id="page_aura_999",
            username="Trinity Official",
            display_name="Trinity Ecosystem",
            status="active"
        )
        session.add(acc)

        tok = OAuthTokenRecord(
            account_id=account_id,
            encrypted_access_token=vault.encrypt("test_access_token_abc"),
            encrypted_refresh_token=vault.encrypt("test_refresh_token_xyz")
        )
        session.add(tok)
        await session.commit()

        saved_tok = await session.get(OAuthTokenRecord, tok.id)
        assert saved_tok is not None
        assert saved_tok.access_token == "test_access_token_abc"
        assert saved_tok.refresh_token == "test_refresh_token_xyz"


@pytest.mark.asyncio
async def test_guardrails_safety():
    safe_post = "Trinity Backend Engine na doméne aura.dev prináša plne autonómny AI ekosystém. Objavte viac!"
    is_safe, msg = guardrails.validate_content_safety(safe_post)
    assert is_safe is True

    spam_post = "Click here for free crypto giveaway whatsapp +123456789"
    is_spam_safe, spam_msg = guardrails.validate_content_safety(spam_post)
    assert is_spam_safe is False
    assert "detected" in spam_msg

    ok, _ = guardrails.check_rate_limit("x", "post")
    assert ok is True


@pytest.mark.asyncio
async def test_fastapi_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Health check
        res_health = await ac.get("/health")
        assert res_health.status_code == 200
        data = res_health.json()
        assert data["status"] == "healthy"
        assert data["agent"] == "Morpheus"
        assert "aura.dev" in data["domain"]

        # 2. Auth status
        res_auth = await ac.get("/api/v1/auth/status")
        assert res_auth.status_code == 200
        auth_data = res_auth.json()
        assert "connections" in auth_data
        assert len(auth_data["connections"]) >= 5

        # 3. Create short link
        res_link = await ac.post("/api/v1/links/shorten", json={
            "target_url": "https://aura.dev/features",
            "campaign": "twitter_promo"
        })
        assert res_link.status_code == 200
        link_data = res_link.json()
        code = link_data["code"]
        assert code is not None

        # 4. Access short link (Redirect 302)
        res_redirect = await ac.get(f"/l/{code}", follow_redirects=False)
        assert res_redirect.status_code == 302
        assert res_redirect.headers["location"] == "https://aura.dev/features"

        # 5. Serve HTML dashboard
        res_dash = await ac.get("/dashboard")
        assert res_dash.status_code == 200
        assert "Morpheus AI Social Commander" in res_dash.text
        assert "OAuth 2.0 Engine" in res_dash.text
