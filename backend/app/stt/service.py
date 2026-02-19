import json
import logging
import re
from datetime import date, datetime
from typing import Any, Dict, List, Union

from app.stt.models import llm_extract, load_models, transcribe
from app.stt.prompt import RECORD_EXTRACTION_PROMPT

logger = logging.getLogger("todoc.stt")

VALID_ENUMS = {
    "record_type": {"growth", "sleep", "meal", "health", "diaper", "etc"},
    "meal_type": {"snack", "breast_milk", "formula", "bottle", "baby_food", "other"},
    "sleep_type": {"nap", "night"},
    "sleep_quality": {"good", "normal", "bad"},
    "diaper_type": {"urine", "stool", "both"},
    "amount": {"much", "normal", "little"},
    "condition": {"normal", "diarrhea", "constipation"},
    "color": {"yellow", "brown", "green", "other"},
    "symptoms": {"fever", "runny_nose", "cough", "vomit", "diarrhea", "rash", "headache"},
    "medicines": {"antipyretic", "painkiller", "cold_medicine", "antibiotic", "ointment", "eye_drops"},
    "activities": {"reading", "walking", "bathing", "playing", "music", "exercise", "swimming"},
}


def _parse_json(raw: str) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """Extract JSON object or array from LLM output, handling markdown fences."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip()
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()

    # Try array first
    arr_start = cleaned.find("[")
    arr_end = cleaned.rfind("]")
    if arr_start != -1 and arr_end != -1 and arr_start < cleaned.find("{"):
        parsed = json.loads(cleaned[arr_start : arr_end + 1])
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed

    # Fall back to single object
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON found in LLM output: {raw[:200]}")
    return json.loads(cleaned[start : end + 1])


def _validate_enum(data: dict, field: str, valid_set: set) -> None:
    """Nullify invalid enum values."""
    val = data.get(field)
    if val is not None and val not in valid_set:
        logger.warning(f"Invalid enum for {field}: {val}, setting to null")
        data[field] = None


def _validate_enum_list(data: dict, field: str, valid_set: set) -> None:
    """Filter invalid entries from enum list fields."""
    val = data.get(field)
    if isinstance(val, list):
        data[field] = [v for v in val if v in valid_set] or None


def validate_record_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and sanitize extracted record data."""
    rt = data.get("record_type")
    if rt not in VALID_ENUMS["record_type"]:
        data["record_type"] = "etc"
        data["title"] = data.get("title") or data.get("memo") or "음성 기록"

    if not data.get("record_date"):
        data["record_date"] = date.today().isoformat()

    now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    today_noon = data["record_date"] + "T12:00:00"

    if data["record_type"] == "meal":
        _validate_enum(data, "meal_type", VALID_ENUMS["meal_type"])
        if not data.get("meal_type"):
            data["meal_type"] = "other"
        if not data.get("meal_datetime"):
            data["meal_datetime"] = today_noon
            data["unknown_time"] = True
        if data.get("amount_ml") is not None:
            try:
                data["amount_ml"] = max(0, min(500, int(data["amount_ml"])))
            except (ValueError, TypeError):
                data["amount_ml"] = None
        if data.get("duration_minutes") is not None:
            try:
                data["duration_minutes"] = max(0, min(60, int(data["duration_minutes"])))
            except (ValueError, TypeError):
                data["duration_minutes"] = None

    elif data["record_type"] == "sleep":
        _validate_enum(data, "sleep_type", VALID_ENUMS["sleep_type"])
        _validate_enum(data, "sleep_quality", VALID_ENUMS["sleep_quality"])
        if not data.get("sleep_type"):
            data["sleep_type"] = "nap"
        if not data.get("start_datetime"):
            data["start_datetime"] = today_noon
        if not data.get("end_datetime"):
            data["end_datetime"] = data["start_datetime"]

    elif data["record_type"] == "diaper":
        _validate_enum(data, "diaper_type", VALID_ENUMS["diaper_type"])
        _validate_enum(data, "amount", VALID_ENUMS["amount"])
        _validate_enum(data, "condition", VALID_ENUMS["condition"])
        _validate_enum(data, "color", VALID_ENUMS["color"])
        if not data.get("diaper_type"):
            data["diaper_type"] = "stool"
        if not data.get("diaper_datetime"):
            data["diaper_datetime"] = today_noon
            data["unknown_time"] = True

    elif data["record_type"] == "growth":
        _validate_enum_list(data, "activities", VALID_ENUMS["activities"])
        for field, lo, hi in [
            ("height_cm", 30, 140),
            ("weight_kg", 1, 45),
            ("head_circumference_cm", 20, 62),
        ]:
            if data.get(field) is not None:
                try:
                    data[field] = max(lo, min(hi, float(data[field])))
                except (ValueError, TypeError):
                    data[field] = None

    elif data["record_type"] == "health":
        _validate_enum_list(data, "symptoms", VALID_ENUMS["symptoms"])
        _validate_enum_list(data, "medicines", VALID_ENUMS["medicines"])
        if not data.get("title"):
            data["title"] = "건강 기록"
        if not data.get("health_datetime"):
            data["health_datetime"] = today_noon
            data["unknown_time"] = True

    elif data["record_type"] == "etc":
        if not data.get("title"):
            data["title"] = "음성 기록"

    return data


async def process_speech_to_record(
    audio_bytes: bytes, audio_suffix: str = ".webm"
) -> Dict[str, Any]:
    """Full pipeline: audio → transcript → structured JSON(s). No DB save."""
    # Step 0: Ensure models are loaded (lazy — first request only)
    load_models()

    # Step 1: Transcribe
    logger.info("Step 1: Transcribing audio...")
    transcript = transcribe(audio_bytes, suffix=audio_suffix)
    if not transcript:
        raise ValueError("Transcription returned empty text")

    # Step 2: Build prompt with current time context
    now = datetime.now()
    prompt = RECORD_EXTRACTION_PROMPT.format(
        today=now.strftime("%Y-%m-%d"),
        now=now.strftime("%H:%M"),
    )

    # Step 3: LLM extraction
    logger.info("Step 2: Extracting structured data via LLM...")
    raw_output = llm_extract(prompt, transcript)

    # Step 4: Parse JSON (single object or array)
    logger.info("Step 3: Parsing JSON output...")
    try:
        parsed = _parse_json(raw_output)
    except (ValueError, json.JSONDecodeError) as e:
        logger.warning(f"JSON parsing failed: {e}, falling back to etc record")
        parsed = {
            "record_type": "etc",
            "record_date": now.strftime("%Y-%m-%d"),
            "title": transcript[:200],
            "memo": f"(음성 인식 원문) {transcript}",
        }

    # Normalize to list
    items = parsed if isinstance(parsed, list) else [parsed]

    # Step 5: Validate each record
    logger.info(f"Step 4: Validating {len(items)} record(s)...")
    records = []
    for item in items:
        validated = validate_record_data(item)
        records.append({
            "record_type": validated["record_type"],
            "record_data": validated,
        })

    return {
        "transcript": transcript,
        "records": records,
    }
