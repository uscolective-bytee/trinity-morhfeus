"""
Core Guardrails and Rate Limiting
Enforces per-platform throttling, spam filtering, and brand safety.
"""

import re
import datetime
from typing import Dict, Tuple


class SocialGuardrails:
    def __init__(self):
        self.limits: Dict[str, Dict[str, int]] = {
            "meta": {"post": 30, "reply": 150},
            "x": {"post": 50, "reply": 200},
            "linkedin": {"post": 15, "reply": 50},
            "youtube": {"post": 10, "reply": 50},
            "tiktok": {"post": 10, "reply": 50}
        }
        self.daily_counts: Dict[str, int] = {}

        self.banned_patterns = [
            r"free\s*crypto\s*giveaway",
            r"whatsapp\s*\+\d+",
            r"t\.me\/\w+",
            r"invest\s*and\s*double",
            r"porn|casino|xxx",
            r"password|seed\s*phrase"
        ]

    def check_rate_limit(self, platform: str, action: str = "post") -> Tuple[bool, str]:
        today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
        key = f"{platform}:{action}:{today}"
        current = self.daily_counts.get(key, 0)
        max_allowed = self.limits.get(platform, {}).get(action, 50)

        if current >= max_allowed:
            return False, f"Rate limit reached for {platform} {action} ({current}/{max_allowed} today)."

        self.daily_counts[key] = current + 1
        return True, "OK"

    def validate_content_safety(self, text: str) -> Tuple[bool, str]:
        if not text or len(text.strip()) == 0:
            return False, "Content cannot be empty."

        for pattern in self.banned_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return False, f"Content triggered safety filter: pattern '{pattern}' detected."

        return True, "Safe"


guardrails = SocialGuardrails()
