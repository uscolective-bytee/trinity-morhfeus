"""
LinkedIn Platform Adapter
"""

from typing import Dict, Any, Optional
import httpx


class LinkedInAdapter:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.linkedin.com/v2"

    async def publish_share(self, author_urn: str, commentary: str, title: Optional[str] = None, target_url: Optional[str] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=25.0) as client:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }

            share_media = []
            if target_url:
                share_media.append({
                    "status": "READY",
                    "description": {"text": commentary[:200]},
                    "originalUrl": target_url,
                    "title": {"text": title or "Trinity AI Network"}
                })

            payload = {
                "author": author_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {"text": commentary},
                        "shareMediaCategory": "ARTICLE" if target_url else "NONE",
                        "media": share_media
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }

            resp = await client.post(f"{self.base_url}/ugcPosts", headers=headers, json=payload)
            if resp.status_code in (200, 201):
                return resp.json()
            return {"error": resp.text, "status_code": resp.status_code}
