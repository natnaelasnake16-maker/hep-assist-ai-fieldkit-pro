import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
PROTOCOL_DIR = DATA_DIR / "protocols"
RUNTIME_DIR = ROOT_DIR / "runtime"
RUNTIME_DIR.mkdir(exist_ok=True)

@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "HEP Assist AI FieldKit Pro")
    app_env: str = os.getenv("APP_ENV", "development")
    ai_provider: str = os.getenv("AI_PROVIDER", "offline_rules")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    openai_compatible_base_url: str = os.getenv("OPENAI_COMPATIBLE_BASE_URL", "http://localhost:8001/v1")
    openai_compatible_api_key: str = os.getenv("OPENAI_COMPATIBLE_API_KEY", "change-me")
    openai_compatible_model: str = os.getenv("OPENAI_COMPATIBLE_MODEL", "local-health-assistant")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./fieldkit.db")
    enable_review_queue: bool = os.getenv("ENABLE_REVIEW_QUEUE", "true").lower() == "true"
    enable_pii_redaction: bool = os.getenv("ENABLE_PII_REDACTION", "true").lower() == "true"
    max_response_tokens: int = int(os.getenv("MAX_RESPONSE_TOKENS", "700"))

settings = Settings()
