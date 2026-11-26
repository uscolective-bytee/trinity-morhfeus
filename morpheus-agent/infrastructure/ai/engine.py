"""
Infrastructure AI Engine
Multi-LLM client (OpenAI GPT-4o, Anthropic Claude, Gemini 2.0, Cloudflare Workers AI)
"""

import os
import json
from typing import Dict, Any, Optional
import httpx


class MorpheusAIEngine:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.workers_ai_token = os.getenv("CF_API_TOKEN", "")
        self.cf_account_id = os.getenv("CF_ACCOUNT_ID", "b60342e5e52f5646fbd4e913bb409334")

    async def generate_social_post(
        self,
        topic: str,
        platform: str,
        tone: str = "visionary, sharp, professional",
        link: Optional[str] = None
    ) -> Dict[str, Any]:
        system_prompt = f"""Si Morpheus, plne autonómny AI agent a vrchný marketér technologického ekosystému Trinity (aura.dev).
Tvojou úlohou je vytvárať špičkový, pútavý a virálny obsah pre sociálne siete.
Platforma: {platform}
Tón komunikácie: {tone}
Pravidlá platformy:
- X / Twitter: Max 280 znakov, úderný hook, 2-3 relevantné hashtagy, jasné CTA.
- LinkedIn: Hlbší profesionálny pohľad, insight do AI/Fintech, štruktúrované odseky.
- Meta (Facebook / Instagram): Emocionálny hook, vizuálny kontext, emoji, zapojenie komunity.
Vráť odpoveď vo formáte JSON:
{{
  "content_text": "text príspevku",
  "hashtags": ["#tag1", "#tag2"],
  "suggested_image_prompt": "popis obrázku pre DALL-E / Flux"
}}"""

        user_prompt = f"Zadanie na príspevok: {topic}"
        if link:
            user_prompt += f"\nZahrň odkaz: {link}"

        raw_response = await self._call_llm(system_prompt, user_prompt)
        try:
            clean = raw_response.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            return {
                "content_text": raw_response.strip(),
                "hashtags": ["#Trinity", "#AI", "#Tech"],
                "suggested_image_prompt": f"Futuristic cyber visual representing {topic}"
            }

    async def analyze_and_reply(
        self,
        message_text: str,
        sender_username: Optional[str],
        platform: str
    ) -> Dict[str, Any]:
        system_prompt = """Si Morpheus, autonómny administrátor Trinity ekosystému.
Vyhodnoť prichádzajúcu správu alebo komentár od používateľa.
Rozhodni, či ide o:
1. spam / trolling / urážku -> "is_spam": true, "should_delete": true
2. otázku / záujem / lead -> "is_spam": false, navrhni stručnú, priateľskú a vecnú odpoveď s odkazom na aura.dev
Vráť striktný JSON:
{
  "sentiment": "positive" | "neutral" | "negative" | "spam",
  "is_spam": boolean,
  "should_delete": boolean,
  "reply_text": "text tvojej odpovede" (alebo null ak spam)
}"""

        user_prompt = f"Používateľ: {sender_username or 'anonym'}\nPlatforma: {platform}\nSpráva: {message_text}"
        raw_response = await self._call_llm(system_prompt, user_prompt)
        try:
            clean = raw_response.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except Exception:
            return {
                "sentiment": "neutral",
                "is_spam": False,
                "should_delete": False,
                "reply_text": "Ďakujeme za váš komentár! Pre viac informácií o systéme Trinity navštívte aura.dev."
            }

    async def _call_llm(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if self.openai_key:
                try:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {self.openai_key}"},
                        json={
                            "model": "gpt-4o",
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": user}
                            ],
                            "temperature": 0.7
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
                except Exception:
                    pass

            if self.gemini_key:
                try:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}",
                        json={
                            "system_instruction": {"parts": [{"text": system}]},
                            "contents": [{"parts": [{"text": user}]}]
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                except Exception:
                    pass

            if self.workers_ai_token and self.cf_account_id:
                try:
                    resp = await client.post(
                        f"https://api.cloudflare.com/client/v4/accounts/{self.cf_account_id}/ai/run/@cf/meta/llama-3.3-70b-instruct",
                        headers={"Authorization": f"Bearer {self.workers_ai_token}"},
                        json={
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": user}
                            ]
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json()["result"]["response"]
                except Exception:
                    pass

        return "Trinity backend posúva hranice autonómnej umelej inteligencie. Navštívte aura.dev #Trinity #AI"


ai_engine = MorpheusAIEngine()
