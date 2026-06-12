import re

AMHARIC_RE = re.compile(r"[\u1200-\u137F]")

SYMPTOM_AM_TO_EN = {
    "ትኩሳት": "fever",
    "ሳል": "cough",
    "ትንፋሽ": "fast breathing",
    "ደም": "bleeding",
    "መንቀጥቀጥ": "convulsion",
    "ተቅማጥ": "diarrhea",
    "ማስታወክ": "vomiting",
}

SYMPTOM_EN_ALIASES = {
    "difficulty breathing": "fast breathing",
    "breathing difficulty": "fast breathing",
    "rapid breathing": "fast breathing",
    "chest indrawing": "chest indrawing",
    "convulsions": "convulsion",
    "fits": "convulsion",
    "lethargic": "lethargy",
    "unable to drink": "unable to drink",
    "not breastfeeding": "unable to drink",
    "bleeding": "bleeding",
    "fever": "fever",
    "cough": "cough",
    "diarrhea": "diarrhea",
    "vomiting": "vomiting",
    "severe dehydration": "severe dehydration",
}

def detect_language(text: str, requested: str = "auto") -> str:
    if requested in {"en", "am"}:
        return requested
    return "am" if AMHARIC_RE.search(text) else "en"

def extract_symptoms(text: str) -> list[str]:
    lowered = text.lower()
    for negated in ["no fever", "without fever", "no fast breathing", "no breathing difficulty", "no bleeding", "no convulsion", "no convulsions"]:
        lowered = lowered.replace(negated, "")
    symptoms = set()
    for phrase, canonical in SYMPTOM_EN_ALIASES.items():
        if phrase in lowered:
            symptoms.add(canonical)
    for am, canonical in SYMPTOM_AM_TO_EN.items():
        if am in text:
            symptoms.add(canonical)
    return sorted(symptoms)

def amharic_label_for_urgency(urgency: str) -> str:
    return {
        "emergency": "አስቸኳይ ሪፈራል",
        "same_day": "በዛሬው ቀን መታየት ያለበት",
        "routine": "መደበኛ ክትትል",
    }.get(urgency, urgency)
