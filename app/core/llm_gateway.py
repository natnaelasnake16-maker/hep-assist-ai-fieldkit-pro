from __future__ import annotations
import json
from dataclasses import dataclass
from typing import List
import httpx
from app.core.config import settings
from app.core.schemas import EvidenceChunk, GraphFinding
from app.core.language import amharic_label_for_urgency

@dataclass
class LLMResult:
    text: str
    provider: str

class BaseLLMProvider:
    name = "base"
    def generate(self, *, prompt: str, language: str, urgency: str, actions: List[str], evidence: List[EvidenceChunk], graph_findings: List[GraphFinding]) -> LLMResult:
        raise NotImplementedError

class OfflineRuleLLM(BaseLLMProvider):
    name = "offline_rules"
    def generate(self, *, prompt: str, language: str, urgency: str, actions: List[str], evidence: List[EvidenceChunk], graph_findings: List[GraphFinding]) -> LLMResult:
        cite_titles = ", ".join([e.title for e in evidence[:3]]) or "local protocol packet"
        danger_lines = [g.reason for g in graph_findings if g.urgency == "emergency"]
        if language == "am":
            urgency_label = amharic_label_for_urgency(urgency)
            signal_map = {
                "convulsion": "ንቅጥቅጥ አለ።",
                "lethargy": "ንቃት መቀነስ ወይም መፍዘዝ አለ።",
                "unable_to_drink": "መጠጣት ወይም ጡት መጥባት አይችልም።",
                "vomiting_everything": "ሁሉንም እየተወከ ነው።",
                "chest_indrawing": "የደረት መጎዝጎዝ አለ።",
                "pregnancy_bleeding": "በእርግዝና ወቅት ደም መፍሰስ አለ።",
                "pregnancy_severe_headache": "በእርግዝና ጊዜ ከባድ ራስ ምታት አለ።",
                "reduced_fetal_movement": "የፅንስ እንቅስቃሴ ቀንሷል።",
                "severe_dehydration": "ከባድ የውሃ እጥረት ምልክቶች አሉ።",
                "fast_breathing_child": "ፈጣን ትንፋሽ አለ፣ የሳንባ ምች አደጋ ሊኖር ይችላል።",
                "young_infant_fever": "በትንሽ ሕፃን ውስጥ ትኩሳት ከፍተኛ አደጋ ነው።",
                "fever_child": "ትኩሳት ዛሬ የአደጋ ምልክቶች ግምገማ ይፈልጋል።",
                "rr_fast_2_11m": "የመተንፈሻ መጠን ለእድሜው ፈጣን ነው።",
                "rr_fast_12_59m": "የመተንፈሻ መጠን ለእድሜው ፈጣን ነው።",
            }
            danger_lines = [signal_map.get(g.signal, g.reason) for g in graph_findings[:4]] or ["አጠቃላይ የአደጋ ምልክቶችን ይፈትሹ።"]
            if urgency == "emergency":
                action_lines = [
                    "- ታካሚውን ወዲያውኑ ሪፈር ያድርጉ።",
                    "- ሱፐርቫይዘር ወይም የሪፈራል ተቋምን ወዲያውኑ ያሳውቁ።",
                    "- የአካባቢ ፕሮቶኮል መሠረት የቅድመ ሪፈራል እርምጃ ይጀምሩ።",
                ]
            elif urgency == "same_day":
                action_lines = [
                    "- በዛሬው ቀን ግምገማና አስተዳደር ያድርጉ።",
                    "- የአደጋ ምልክቶችን፣ የመተንፈሻ መጠንን እና የሙቀት መጠንን ይፈትሹ።",
                    "- እንደ አካባቢ ፕሮቶኮል ሕክምና ወይም ሪፈራል ይወስኑ።",
                ]
            else:
                action_lines = [
                    "- የቤት እንክብካቤ ምክር ይስጡ።",
                    "- ፈሳሽና አመጋገብ እንዲቀጥል ያበረታቱ።",
                    "- የአደጋ ምልክቶች ከታዩ ፈጥነው እንዲመለሱ ይንገሩ።",
                ]
            danger_text = "\n".join([f"- {d}" for d in danger_lines])
            action_text = "\n".join(action_lines)
            return LLMResult(
                text=(
                    f"**የክብደት ደረጃ: {urgency_label}**\n\n"
                    f"**አሁን የሚደረጉ እርምጃዎች**\n{action_text}\n\n"
                    f"**የአደጋ ምልክቶች**\n{danger_text}\n\n"
                    f"**የፕሮቶኮል ማስረጃ**: {cite_titles}\n\n"
                    "ይህ መሳሪያ ለሰለጠኑ የጤና ባለሙያዎች የውሳኔ ድጋፍ ነው፤ የአካባቢ ፕሮቶኮልን እና የሱፐርቫይዘር መመሪያን ይከተሉ።"
                ),
                provider=self.name,
            )
        action_text = "\n".join([f"- {a}" for a in actions]) if actions else "- Collect missing case information and reassess using the protocol."
        danger_text = "\n".join([f"- {d}" for d in danger_lines]) if danger_lines else "- Check general danger signs, hydration, feeding, breathing, consciousness, and caregiver ability to return."
        return LLMResult(
            text=(
                f"**Triage: {urgency.upper().replace('_','-')}**\n\n"
                f"**Recommended actions**\n{action_text}\n\n"
                f"**Danger signs to check now**\n{danger_text}\n\n"
                f"**Protocol evidence used**: {cite_titles}\n\n"
                "This is decision support for trained health workers, not a replacement for clinical judgment. Follow local Ministry protocol and escalate uncertain or high-risk cases."
            ),
            provider=self.name,
        )

class OllamaLLM(BaseLLMProvider):
    name = "ollama"
    def generate(self, *, prompt: str, language: str, urgency: str, actions: List[str], evidence: List[EvidenceChunk], graph_findings: List[GraphFinding]) -> LLMResult:
        if language == "am":
            return OfflineRuleLLM().generate(prompt=prompt, language=language, urgency=urgency, actions=actions, evidence=evidence, graph_findings=graph_findings)
        compact_prompt = self._build_compact_prompt(
            language=language,
            urgency=urgency,
            actions=actions,
            evidence=evidence,
            graph_findings=graph_findings,
        )
        try:
            with httpx.Client(timeout=45) as client:
                response = client.post(
                    f"{settings.ollama_base_url.rstrip('/')}/api/generate",
                    json={
                        "model": settings.ollama_model,
                        "prompt": compact_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": min(settings.max_response_tokens, 220),
                        },
                    },
                )
                response.raise_for_status()
                data = response.json()
                text = data.get("response", "").strip()
                if text:
                    return LLMResult(text=text, provider=f"ollama:{settings.ollama_model}")
        except Exception as exc:
            fallback = OfflineRuleLLM().generate(prompt=prompt, language=language, urgency=urgency, actions=actions, evidence=evidence, graph_findings=graph_findings)
            fallback.text = f"_Ollama unavailable, used offline safety mode. Reason: {type(exc).__name__}_\n\n" + fallback.text
            return fallback
        return OfflineRuleLLM().generate(prompt=prompt, language=language, urgency=urgency, actions=actions, evidence=evidence, graph_findings=graph_findings)

    @staticmethod
    def _build_compact_prompt(*, language: str, urgency: str, actions: List[str], evidence: List[EvidenceChunk], graph_findings: List[GraphFinding]) -> str:
        evidence_lines = [f"- {e.title}: {e.text[:180].replace(chr(10), ' ')}" for e in evidence[:2]]
        finding_lines = [f"- {g.signal}: {g.reason}" for g in graph_findings[:4]]
        action_lines = [f"- {a}" for a in actions[:4]]
        if language == "am":
            return (
                "Respond ONLY in Amharic script for a trained Health Extension Worker. "
                "Do not use English sentences except unavoidable clinical abbreviations. "
                "Do not invent diagnosis. Keep it short and action-first. "
                f"Urgency: {urgency}.\n"
                f"Graph findings:\n{chr(10).join(finding_lines) or '- none'}\n"
                f"Actions:\n{chr(10).join(action_lines) or '- collect missing information'}\n"
                f"Evidence:\n{chr(10).join(evidence_lines) or '- local protocol packet'}\n"
                "Use these section headings exactly: የአደጋ ደረጃ ማጠቃለያ, አሁን የሚደረጉ እርምጃዎች, ለእንክብካቤ ሰጪ ምክር, የሪፈራል ማስጠንቀቂያ."
            )
        target_language = "plain English" if language == "en" else f"the requested language ({language})"
        return (
            f"Respond ONLY in {target_language} for a trained Health Extension Worker. "
            "Do not fall back to English unless the requested language is impossible. "
            "Do not invent diagnoses. Keep it under 160 words and action-first. "
            f"Urgency: {urgency}.\n"
            f"Graph findings:\n{chr(10).join(finding_lines) or '- none'}\n"
            f"Actions:\n{chr(10).join(action_lines) or '- collect missing information'}\n"
            f"Evidence:\n{chr(10).join(evidence_lines) or '- local protocol packet'}\n"
            "Write: short triage summary, immediate actions, caregiver advice, and referral warning if needed."
        )

class OpenAICompatibleLLM(BaseLLMProvider):
    name = "openai_compatible"
    def generate(self, *, prompt: str, language: str, urgency: str, actions: List[str], evidence: List[EvidenceChunk], graph_findings: List[GraphFinding]) -> LLMResult:
        try:
            with httpx.Client(timeout=20) as client:
                response = client.post(
                    f"{settings.openai_compatible_base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_compatible_api_key}"},
                    json={
                        "model": settings.openai_compatible_model,
                        "messages": [
                            {"role": "system", "content": "You are a cautious clinical decision-support assistant for trained HEWs."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.1,
                        "max_tokens": settings.max_response_tokens,
                    },
                )
                response.raise_for_status()
                data = response.json()
                text = data["choices"][0]["message"]["content"].strip()
                return LLMResult(text=text, provider=f"openai_compatible:{settings.openai_compatible_model}")
        except Exception as exc:
            fallback = OfflineRuleLLM().generate(prompt=prompt, language=language, urgency=urgency, actions=actions, evidence=evidence, graph_findings=graph_findings)
            fallback.text = f"_OpenAI-compatible endpoint unavailable, used offline safety mode. Reason: {type(exc).__name__}_\n\n" + fallback.text
            return fallback

def get_llm_provider() -> BaseLLMProvider:
    provider = settings.ai_provider.lower().strip()
    if provider == "ollama":
        return OllamaLLM()
    if provider == "openai_compatible":
        return OpenAICompatibleLLM()
    return OfflineRuleLLM()
