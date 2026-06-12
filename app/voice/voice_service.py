from __future__ import annotations
from app.core.schemas import VoiceTranscribeResponse

class VoiceService:
    def transcribe_placeholder(self, language: str = "auto") -> VoiceTranscribeResponse:
        return VoiceTranscribeResponse(
            transcript="Voice file received. Install faster-whisper and enable the Whisper adapter for real transcription.",
            language=language if language != "auto" else "en",
            engine="placeholder",
            note="The browser UI supports Web Speech API where available; server-side Whisper is optional for on-prem deployments.",
        )

    def tts_preview(self, text: str, language: str) -> dict:
        return {
            "engine": "browser_speech_synthesis_preview",
            "language": language,
            "text": text[:500],
            "note": "The UI uses browser SpeechSynthesis for demo read-aloud. On-prem TTS can be connected here.",
        }

voice_service = VoiceService()
