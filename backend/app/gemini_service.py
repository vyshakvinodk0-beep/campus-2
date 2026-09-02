import os
from typing import Optional
from google import genai

def get_gemini_client() -> Optional[genai.Client]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception:
        return None

def ask_gemini(prompt: str, system_instruction: Optional[str] = None) -> str:
    """
    Executes grounded AI analysis via Google GenAI SDK.
    Falls back gracefully to deterministic analysis when GEMINI_API_KEY is not configured.
    """
    client = get_gemini_client()
    if not client:
        return ""
    try:
        config = {}
        if system_instruction:
            config["system_instruction"] = system_instruction
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=config if config else None
        )
        return response.text or ""
    except Exception as e:
        print(f"[Gemini Service Warning] AI generation fallback triggered: {e}")
        return ""
