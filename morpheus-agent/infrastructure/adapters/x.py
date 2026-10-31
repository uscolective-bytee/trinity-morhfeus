"""
X / Twitter Platform Adapter (Twitter API v2)
"""

from typing import Dict, Any, Optional
import httpx


class XAdapter:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.twitter.com/2"

    async def post_tweet(self, text: str, reply_to_tweet_id: Optional[str] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            payload: Dict[str, Any] = {"text": text}
            if reply_to_tweet_id:
                payload["reply"] = {"in_reply_to_tweet_id": reply_to_tweet_id}

            resp = await client.post(f"{self.base_url}/tweets", headers=headers, json=payload)
            if resp.status_code in (200, 201):
                return resp.json()
            return {"error": resp.text, "status_code": resp.status_code}

    async def send_dm(self, recipient_id: str, message_text: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            url = f"{self.base_url}/dm_conversations/with/{recipient_id}/messages"
            payload = {"message": {"text": message_text}}
            resp = await client.post(url, headers=headers, json=payload)
            return resp.json()

    async def delete_tweet(self, tweet_id: str) -> bool:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            resp = await client.delete(f"{self.base_url}/tweets/{tweet_id}", headers=headers)
            return resp.status_code == 200
