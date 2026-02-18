import logging
import tempfile
import os

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger("todoc.stt")

_client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def load_models():
    """No-op for API mode. Kept for backward compatibility."""
    pass


def transcribe(audio_bytes: bytes, suffix: str = ".webm") -> str:
    """Transcribe audio bytes to Korean text using OpenAI Whisper API."""
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, audio_bytes)
        os.close(fd)
        client = _get_client()
        with open(tmp_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio_file,
                language="ko",
            )
        text = result.text.strip()
        logger.info(f"Transcription: {text}")
        return text
    finally:
        os.unlink(tmp_path)


def llm_extract(system_prompt: str, user_text: str) -> str:
    """Extract structured data using OpenAI Chat API."""
    client = _get_client()
    response = client.chat.completions.create(
        model=settings.openai_model,  # gpt-4o-mini
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        temperature=0.1,
        max_tokens=512,
    )
    text = response.choices[0].message.content.strip()
    logger.info(f"LLM output: {text}")
    return text
