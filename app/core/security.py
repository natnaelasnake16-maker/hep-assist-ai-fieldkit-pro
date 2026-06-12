import re
from dataclasses import dataclass
from typing import List

PHONE_RE = re.compile(r"(?<!\d)(?:\+251|0)?9\d{8}(?!\d)")
LONG_ID_RE = re.compile(r"(?<!\d)\d{10,16}(?!\d)")
INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all previous",
    "reveal system prompt",
    "developer message",
    "disable safety",
    "do not cite",
]

@dataclass
class RedactionResult:
    text: str
    pii_redacted: bool
    prompt_injection_detected: bool
    warnings: List[str]

def redact_and_screen(text: str) -> RedactionResult:
    warnings: List[str] = []
    redacted = PHONE_RE.sub("[REDACTED_PHONE]", text)
    redacted = LONG_ID_RE.sub("[REDACTED_ID]", redacted)
    pii_redacted = redacted != text
    lowered = text.lower()
    prompt_injection = any(p in lowered for p in INJECTION_PATTERNS)
    if pii_redacted:
        warnings.append("PII was redacted before logging or downstream model use.")
    if prompt_injection:
        warnings.append("Prompt-injection style instruction detected and ignored.")
    return RedactionResult(redacted, pii_redacted, prompt_injection, warnings)
