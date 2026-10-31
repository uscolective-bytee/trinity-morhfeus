"""
Core Configuration Module for Trinity Backend & Morpheus Agent
Domain: aura.dev (with fallback to auru.dev)
"""

import os
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import httpx


class DNSRecord(BaseModel):
    type: str  # A, AAAA, CNAME, TXT, MX
    name: str
    content: str
    ttl: int = 1  # 1 = auto in Cloudflare
    proxied: bool = True
    comment: Optional[str] = None


class DomainSettings(BaseModel):
    primary_domain: str = Field(default_factory=lambda: os.getenv("MORPHEUS_PRIMARY_DOMAIN", "aura.dev"))
    secondary_domain: str = Field(default_factory=lambda: os.getenv("MORPHEUS_SECONDARY_DOMAIN", "auru.dev"))
    subdomain: str = Field(default_factory=lambda: os.getenv("MORPHEUS_SUBDOMAIN", "morpheus"))
    staging_domain: str = Field(default_factory=lambda: os.getenv("MORPHEUS_STAGING_DOMAIN", "dev.aura.dev"))
    cloudflare_zone_id: Optional[str] = Field(default_factory=lambda: os.getenv("CLOUDFLARE_ZONE_ID"))
    cloudflare_api_token: Optional[str] = Field(default_factory=lambda: os.getenv("CLOUDFLARE_API_TOKEN"))
    server_public_ip: str = Field(default_factory=lambda: os.getenv("SERVER_PUBLIC_IP", "127.0.0.1"))
    ssl_mode: str = Field(default="strict")  # flexible, full, strict
    
    @property
    def full_host(self) -> str:
        """Returns the fully qualified hostname for Morpheus, e.g. morpheus.aura.dev or aura.dev"""
        if self.subdomain and self.subdomain != "@":
            return f"{self.subdomain}.{self.primary_domain}"
        return self.primary_domain

    @property
    def base_url(self) -> str:
        """Returns the public HTTPS base URL for OAuth callbacks and webhooks"""
        return f"https://{self.full_host}"

    @property
    def oauth_callbacks(self) -> Dict[str, str]:
        """Authorized redirect URIs for social platforms"""
        base = self.base_url
        return {
            "meta": f"{base}/api/v1/auth/meta/callback",
            "x": f"{base}/api/v1/auth/x/callback",
            "linkedin": f"{base}/api/v1/auth/linkedin/callback",
            "google_youtube": f"{base}/api/v1/auth/youtube/callback",
            "tiktok": f"{base}/api/v1/auth/tiktok/callback",
        }

    @property
    def webhook_endpoints(self) -> Dict[str, str]:
        """Endpoints for inbound webhooks from social networks"""
        base = self.base_url
        return {
            "meta": f"{base}/api/v1/webhooks/meta",
            "x": f"{base}/api/v1/webhooks/x",
            "linkedin": f"{base}/api/v1/webhooks/linkedin",
            "youtube": f"{base}/api/v1/webhooks/youtube",
            "tiktok": f"{base}/api/v1/webhooks/tiktok",
        }

    @property
    def shortener_url_prefix(self) -> str:
        return f"{self.base_url}/l"

    @property
    def landing_page_url_prefix(self) -> str:
        return f"{self.base_url}/p"


class DomainManager:
    """Orchestrates DNS, SSL/TLS, and routing through Cloudflare and Caddy/Nginx"""

    def __init__(self, settings: Optional[DomainSettings] = None):
        self.settings = settings or DomainSettings()
        self.http_client = httpx.AsyncClient(timeout=15.0)

    def get_required_dns_records(self) -> List[DNSRecord]:
        """
        Returns all DNS records required for aura.dev operations:
        - Morpheus subdomain CNAME / A pointing to production host
        - Domain verification TXT records for Meta, Google, X
        - Email authentication (SPF, DKIM) for system notifications
        """
        host = self.settings.subdomain
        ip = self.settings.server_public_ip
        primary = self.settings.primary_domain

        records = [
            # Main Agent Morpheus Host
            DNSRecord(
                type="A" if ip != "127.0.0.1" else "CNAME",
                name=host,
                content=ip if ip != "127.0.0.1" else primary,
                proxied=True,
                comment="Morpheus AI Social Agent Host"
            ),
            # Meta Domain Verification
            DNSRecord(
                type="TXT",
                name=f"_facebook-domain-verification.{primary}",
                content=os.getenv("META_DOMAIN_VERIFICATION_TOKEN", "trinity-meta-verify-token-placeholder"),
                proxied=False,
                comment="Meta Facebook/Instagram Graph API Domain Verification"
            ),
            # Google / YouTube Site Verification
            DNSRecord(
                type="TXT",
                name=f"@{primary}",
                content=os.getenv("GOOGLE_SITE_VERIFICATION_TOKEN", "google-site-verification=trinity-morpheus-placeholder"),
                proxied=False,
                comment="Google Search Console / YouTube OAuth Domain Verification"
            ),
            # X / Twitter Developer Verification
            DNSRecord(
                type="TXT",
                name=f"_twitter-verification.{primary}",
                content=os.getenv("TWITTER_VERIFICATION_TOKEN", "trinity-x-verify-placeholder"),
                proxied=False,
                comment="X Developer Portal Domain Verification"
            ),
            # SPF Record for outgoing emails/alerts from Morpheus
            DNSRecord(
                type="TXT",
                name=primary,
                content="v=spf1 include:_spf.mx.cloudflare.net ~all",
                proxied=False,
                comment="SPF Record for Trinity notifications"
            )
        ]
        return records

    async def sync_cloudflare_dns(self) -> Dict[str, Any]:
        """
        Directly syncs the DNS records into Cloudflare Zone via API
        """
        if not self.settings.cloudflare_api_token or not self.settings.cloudflare_zone_id:
            return {
                "success": False,
                "error": "CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID is not configured.",
                "pending_records": [r.model_dump() for r in self.get_required_dns_records()]
            }

        headers = {
            "Authorization": f"Bearer {self.settings.cloudflare_api_token}",
            "Content-Type": "application/json"
        }
        zone_id = self.settings.cloudflare_zone_id
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"

        results = []
        try:
            resp = await self.http_client.get(url, headers=headers)
            if resp.status_code != 200:
                return {"success": False, "error": f"Cloudflare API error: {resp.text}"}

            existing = {r["name"]: r for r in resp.json().get("result", [])}

            for record in self.get_required_dns_records():
                rec_name = f"{record.name}.{self.settings.primary_domain}" if not record.name.endswith(self.settings.primary_domain) else record.name
                if record.name == "@":
                    rec_name = self.settings.primary_domain

                payload = {
                    "type": record.type,
                    "name": rec_name,
                    "content": record.content,
                    "ttl": record.ttl,
                    "proxied": record.proxied,
                    "comment": record.comment
                }

                if rec_name in existing:
                    record_id = existing[rec_name]["id"]
                    put_resp = await self.http_client.put(f"{url}/{record_id}", headers=headers, json=payload)
                    results.append({"name": rec_name, "action": "updated", "status": put_resp.status_code})
                else:
                    post_resp = await self.http_client.post(url, headers=headers, json=payload)
                    results.append({"name": rec_name, "action": "created", "status": post_resp.status_code})

            return {"success": True, "results": results}
        except Exception as e:
            return {"success": False, "error": str(e)}


domain_settings = DomainSettings()
domain_manager = DomainManager(domain_settings)
