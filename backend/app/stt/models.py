import logging
import os
import tempfile
from threading import Lock

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoModelForSpeechSeq2Seq,
    AutoProcessor,
    AutoTokenizer,
    pipeline,
)

logger = logging.getLogger("todoc.stt")

_whisper_pipe = None
_qwen_model = None
_qwen_tokenizer = None
_load_lock = Lock()


def _get_device_and_dtype():
    if torch.cuda.is_available():
        return "cuda:0", torch.float16
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps", torch.float32  # MPS float16 causes overflow/NaN errors
    return "cpu", torch.float32


def load_models():
    """Load Whisper and Qwen models once at app startup."""
    global _whisper_pipe, _qwen_model, _qwen_tokenizer
    with _load_lock:
        if _whisper_pipe is not None:
            return

        device, dtype = _get_device_and_dtype()
        logger.info(f"Loading STT models on device={device}, dtype={dtype}")

        # Whisper
        whisper_id = "openai/whisper-large-v3-turbo"
        whisper_model = AutoModelForSpeechSeq2Seq.from_pretrained(
            whisper_id, torch_dtype=dtype, low_cpu_mem_usage=True, use_safetensors=True
        )
        whisper_model.to(device)
        processor = AutoProcessor.from_pretrained(whisper_id)
        _whisper_pipe = pipeline(
            "automatic-speech-recognition",
            model=whisper_model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            torch_dtype=dtype,
            device=device,
        )
        logger.info("Whisper large-v3-turbo loaded")

        # Qwen — CUDA > MPS > CPU (MPS uses float32 to avoid NaN issues)
        qwen_id = "Qwen/Qwen2.5-1.5B-Instruct"
        _qwen_tokenizer = AutoTokenizer.from_pretrained(qwen_id)
        if torch.cuda.is_available():
            _qwen_model = AutoModelForCausalLM.from_pretrained(
                qwen_id, torch_dtype=torch.float16, device_map="auto"
            )
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            _qwen_model = AutoModelForCausalLM.from_pretrained(
                qwen_id, torch_dtype=torch.float32
            ).to("mps")
        else:
            _qwen_model = AutoModelForCausalLM.from_pretrained(
                qwen_id, torch_dtype=torch.float32
            ).to("cpu")
        logger.info("Qwen2.5-1.5B-Instruct loaded")


def transcribe(audio_bytes: bytes, suffix: str = ".webm") -> str:
    """Transcribe audio bytes to Korean text using Whisper."""
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, audio_bytes)
        os.close(fd)
        result = _whisper_pipe(tmp_path, generate_kwargs={"language": "korean"})
        text = result["text"].strip()
        logger.info(f"Transcription: {text}")
        return text
    finally:
        os.unlink(tmp_path)


def llm_extract(system_prompt: str, user_text: str) -> str:
    """Run Qwen inference with system prompt and user text."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_text},
    ]
    text = _qwen_tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    model_inputs = _qwen_tokenizer([text], return_tensors="pt").to(_qwen_model.device)
    generated_ids = _qwen_model.generate(**model_inputs, max_new_tokens=512)
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]):]
    response = _qwen_tokenizer.decode(output_ids, skip_special_tokens=True)
    logger.info(f"LLM output: {response}")
    return response
