"""
YouTube & TikTok Platform Adapters
"""

from typing import Dict, Any, Optional
import httpx


class YouTubeAdapter:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://www.googleapis.com/youtube/v3"

    async def get_channel_info(self) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            resp = await client.get(f"{self.base_url}/channels?part=snippet,statistics&mine=true", headers=headers)
            return resp.json()


class TikTokAdapter:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://open.tiktokapis.com/v2"

    async def get_creator_info(self) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            resp = await client.post(f"{self.base_url}/user/info/", headers=headers, json={"fields": ["open_id", "display_name", "avatar_url", "follower_count"]})
            return resp.json()
