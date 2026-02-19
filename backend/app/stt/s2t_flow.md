# Speech-to-Record (S2T) 기능 플로우

## 전체 파이프라인

```
[브라우저 마이크] → audio.webm
       ↓
POST /api/speech/transcribe/{kid_id}  (FormData: audio file)
       ↓
┌──────────────────────────────────────┐
│  1. OpenAI Whisper API               │  ← 음성 → 한국어 텍스트
│     model: "gpt-4o-transcribe"       │
│     language: "ko"                   │
└──────────────────────────────────────┘
       ↓ transcript (한국어 텍스트)
┌──────────────────────────────────────┐
│  2. OpenAI Chat API (gpt-4o-mini)    │  ← 텍스트 → 구조화 JSON
│     temperature: 0.1                 │
│     system prompt + transcript       │
└──────────────────────────────────────┘
       ↓ JSON 파싱 + 유효성 검증
┌───────────────────────────────────────────────────────────┐
│  3. Return response (del recording immediately after use) │
│  { transcript, records: [                                 │
│  { record_type, record_data },                            │
│  { record_type, record_data }, ...]}                      │
└───────────────────────────────────────────────────────────┘
       ↓
[프론트엔드: VoiceResultModal]  ← 사용자 순차 확인
       ↓ "저장" 또는 "저장 후 다음" 클릭
POST /api/kids/{kid_id}/records/{type}  ← 기존 기록 생성 API 재활용 (레코드별 호출)
       ↓
[DB 저장 완료]
```

---

## 사용 모델

| 단계 | 모델                | 용도                 | API                                    |
| ---- | ------------------- | -------------------- | -------------------------------------- |
| STT  | `gpt-4o-transcribe` | 한국어 음성 → 텍스트 | `client.audio.transcriptions.create()` |
| 추출 | `gpt-4o-mini`       | 텍스트 → 구조화 JSON | `client.chat.completions.create()`     |

- 모두 OpenAI API 사용 (동일한 `OPENAI_API_KEY`)
- 로컬 모델 로딩 없음, 메모리 사용량 ~0

---

## 백엔드 파일 구조

```
backend/app/stt/
├── __init__.py
├── models.py      ← OpenAI API 호출 (Whisper + Chat)
├── prompt.py      ← GPT-4o-mini용 시스템 프롬프트
└── service.py     ← 파이프라인 오케스트레이션 + JSON 파싱 + 유효성 검증

backend/app/api/
└── speech.py      ← POST /api/speech/transcribe/{kid_id} 엔드포인트
```

---

## models.py — API 호출 코드

```python
from openai import OpenAI
from app.core.config import settings

_client = None

def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client

def transcribe(audio_bytes, suffix=".webm"):
    # 임시 파일 생성 → Whisper API 호출 → 텍스트 반환 → 임시 파일 삭제
    client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=audio_file,
        language="ko",
    )

def llm_extract(system_prompt, user_text):
    # Chat API 호출 → JSON 문자열 반환
    client.chat.completions.create(
        model=settings.openai_model,  # gpt-4o-mini
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        temperature=0.1,
        max_tokens=512,
    )
```

---

## service.py — 파이프라인

```python
async def process_speech_to_record(audio_bytes, audio_suffix=".webm"):
    # 1. Whisper API로 음성 전사
    transcript = transcribe(audio_bytes, suffix=audio_suffix)

    # 2. 현재 시각 주입한 시스템 프롬프트 생성
    prompt = RECORD_EXTRACTION_PROMPT.format(today="2026-02-18", now="14:30")

    # 3. GPT-4o-mini로 구조화 데이터 추출
    raw_output = llm_extract(prompt, transcript)

    # 4. JSON 파싱 (배열 또는 단일 객체)
    parsed = _parse_json(raw_output)

    # 5. 배열로 정규화
    items = parsed if isinstance(parsed, list) else [parsed]

    # 6. 각 레코드 유효성 검증
    records = []
    for item in items:
        validated = validate_record_data(item)
        records.append({
            "record_type": validated["record_type"],
            "record_data": validated,
        })

    return { "transcript": transcript, "records": records }
```

### 복수 기록 처리

- 하나의 음성에 여러 종류의 기록이 포함되면 LLM이 JSON 배열로 출력
- 예: "모유 200ml 먹였고 묽은 변을 봤어" → `[{meal}, {diaper}]`
- `_parse_json()`이 배열과 단일 객체 모두 처리
- 프론트엔드에서 순차적 확인 모달로 각 레코드를 개별 저장

### 유효성 검증 항목

- `record_type` 유효하지 않으면 → `etc`로 폴백
- `record_date` 없으면 → 오늘 날짜
- enum 값 유효하지 않으면 → `null`로 설정
- 숫자 범위 초과 → 클램핑 (예: amount_ml 0~500, height_cm 30~140)
- 필수 필드 없으면 → 기본값 (예: meal_type → "other", diaper_type → "stool")
- JSON 파싱 실패 → `etc` 레코드로 폴백 (transcript를 title에 삽입)

### unknown_time 처리

- 시간이 언급되지 않으면 `unknown_time: true` + datetime을 `T12:00:00`으로 설정 (백엔드 기본값)
- 프론트엔드 VoiceResultModal에서 `unknown_time: true`인 레코드의 시간 필드(`meal_datetime`, `diaper_datetime`, `health_datetime`)는 표시하지 않음
- 사용자에게 의미 없는 12:00 기본값이 보이지 않도록 처리

---

## 시스템 프롬프트 (prompt.py)

GPT-4o-mini에 전달되는 프롬프트 주요 내용:

### 복수 기록 지시

```
중요: 텍스트에 서로 다른 종류의 기록이 포함되어 있으면 반드시 JSON 배열로 분리하여 출력하세요.
예를 들어 식사와 배변이 함께 언급되면 meal 객체와 diaper 객체를 배열로 출력합니다.

복수 예시: "모유 200ml 먹였고 묽은 변을 봤어" →
[{meal 객체}, {diaper 객체}]

단수 예시: {단일 객체}
```

### 지원하는 6가지 기록 유형

#### 1. 식사 (meal)

```json
{
  "record_type": "meal",
  "record_date": "YYYY-MM-DD",
  "meal_datetime": "YYYY-MM-DDTHH:MM:SS",
  "unknown_time": false,
  "meal_type": "breast_milk|formula|bottle|baby_food|snack|other",
  "meal_detail": null,
  "amount_ml": null,
  "amount_text": null,
  "duration_minutes": null,
  "burp": false,
  "memo": null
}
```

- meal_type 매핑: 모유=breast_milk, 분유=formula, 젖병=bottle, 이유식=baby_food, 간식=snack, 기타=other
- amount_ml: 0~500 (ml), duration_minutes: 0~60 (분)

#### 2. 수면 (sleep)

```json
{
  "record_type": "sleep",
  "record_date": "YYYY-MM-DD",
  "sleep_type": "nap|night",
  "start_datetime": "YYYY-MM-DDTHH:MM:SS",
  "end_datetime": "YYYY-MM-DDTHH:MM:SS",
  "sleep_quality": null,
  "memo": null
}
```

- sleep_type: 낮잠=nap, 밤잠=night
- sleep_quality: 좋음=good, 보통=normal, 나쁨=bad

#### 3. 배변 (diaper)

```json
{
  "record_type": "diaper",
  "record_date": "YYYY-MM-DD",
  "diaper_datetime": "YYYY-MM-DDTHH:MM:SS",
  "unknown_time": false,
  "diaper_type": "urine|stool|both",
  "amount": null,
  "condition": null,
  "color": null,
  "memo": null
}
```

- diaper_type: 소변=urine, 대변=stool, 둘다=both
- amount: 많음=much, 보통=normal, 적음=little
- condition: 정상=normal, 설사=diarrhea, 변비=constipation
- color: 노랑=yellow, 갈색=brown, 초록=green, 기타=other

#### 4. 성장 (growth)

```json
{
  "record_type": "growth",
  "record_date": "YYYY-MM-DD",
  "height_cm": null,
  "weight_kg": null,
  "head_circumference_cm": null,
  "activities": null,
  "memo": null
}
```

- height_cm: 30~140, weight_kg: 1~45, head_circumference_cm: 20~62
- activities: 독서=reading, 산책=walking, 목욕=bathing, 놀이=playing, 음악=music, 체조=exercise, 수영=swimming

#### 5. 건강 (health)

```json
{
  "record_type": "health",
  "record_date": "YYYY-MM-DD",
  "health_datetime": "YYYY-MM-DDTHH:MM:SS",
  "unknown_time": false,
  "title": "string",
  "symptoms": null,
  "medicines": null,
  "memo": null
}
```

- symptoms: 열=fever, 콧물=runny_nose, 기침=cough, 구토=vomit, 설사=diarrhea, 발진=rash, 두통=headache
- medicines: 해열제=antipyretic, 진통제=painkiller, 감기약=cold_medicine, 항생제=antibiotic, 연고=ointment, 안약=eye_drops

#### 6. 기타 (etc)

```json
{
  "record_type": "etc",
  "record_date": "YYYY-MM-DD",
  "title": "string",
  "memo": null
}
```

### 한국어 시간 표현 변환 규칙

- 한시=1시, 두시=2시, 세시=3시, 네시=4시, 다섯시=5시, 여섯시=6시, 일곱시=7시, 여덟시=8시, 아홉시=9시, 열시=10시, 열한시=11시, 열두시=12시
- "오전" → 그대로 (오전 두시 → 02:00), "오후" → +12 (오후 두시 → 14:00)
- 오전/오후 미지정 시 추정:
  - 낮잠 → 오후 (두시 → 14:00)
  - 밤잠 → 7~11시는 오후(19:00~23:00), 12~6시는 오전
  - 식사 → 아침=오전(7~9시), 점심=오후(11~13시), 간식=오후(14~16시), 저녁=오후(17~19시)
  - 그 외 → 현재 시각에 가장 가까운 시간대

### 규칙

1. 텍스트에서 기록 유형 자동 판별
2. 여러 종류의 기록이 있으면 JSON 배열로 분리 출력
3. 시간 미언급 → unknown_time=true, datetime=T12:00:00
4. "아까"/"방금" → 현재 시각 -30분
5. "오전"/"오후" → 24시간제 변환
6. 오전/오후 미명시 → 위 시간 변환 규칙 적용
7. 미언급 필드 → null
8. 유형 판단 불가 → etc + title에 요약
9. 순수 JSON만 출력 (마크다운 코드블록 금지)
10. JSON 외 텍스트 절대 출력 금지

---

## 프론트엔드 플로우

### VoiceRecordButton.jsx

- 3가지 상태: `idle` → `recording` → `processing`
- `MediaRecorder` API로 `audio/webm` 캡처
- 최대 60초 자동 정지
- 녹음 완료 → `POST /api/speech/transcribe/{kidId}` 호출
- 성공 → `onResult(data)` 콜백으로 VoiceResultModal 열기

### VoiceResultModal.jsx

- 인식된 텍스트 + 추출된 필드를 한국어 라벨로 표시
- enum 값은 한국어로 변환 (예: breast_milk → 모유)
- datetime은 시:분만 표시
- `unknown_time: true`인 경우 시간 필드 숨김 (12:00 기본값 미표시)
- 카테고리별 배지 색상 (수면=베이지, 성장=초록, 식사=노랑, 건강=빨강, 배변=분홍, 기타=회색)
- **복수 기록 처리**: 순차적 모달 (currentIndex 기반)
  - "저장 후 다음" → 현재 레코드 저장 후 다음으로 이동
  - "건너뛰기" → 저장하지 않고 다음으로 이동
  - 마지막 레코드에서는 "저장" / "취소" 표시
  - 진행 표시: `(1/2)`, `(2/2)` 형태로 헤더에 표시
- "저장" → `POST /api/kids/{kidId}/records/{type}` (기존 API 재활용)
- "취소" → 모달 닫기, 데이터 폐기

### 버튼 배치

- **HomePage**: inline 모드 (140px, 페이지 흐름 내 중앙 배치)
- **RecordCategoryModal**: modal 모드 (56px, 카테고리 그리드 아래)

---

## API 엔드포인트

### POST /api/speech/transcribe/{kid_id}

- **입력**: `UploadFile` (audio/webm, 최대 10MB)
- **인증**: JWT Bearer token
- **검증**: kid 소유권 확인
- **출력** (단일 기록):

```json
{
  "transcript": "두시에서 세시까지 낮잠 잤어요",
  "records": [
    {
      "record_type": "sleep",
      "record_data": {
        "record_type": "sleep",
        "record_date": "2026-02-18",
        "sleep_type": "nap",
        "start_datetime": "2026-02-18T14:00:00",
        "end_datetime": "2026-02-18T15:00:00",
        "sleep_quality": null,
        "memo": null
      }
    }
  ]
}
```

- **출력** (복수 기록):

```json
{
  "transcript": "모유 200ml 먹였고 묽은 변을 봤어",
  "records": [
    {
      "record_type": "meal",
      "record_data": {
        "record_type": "meal",
        "record_date": "2026-02-18",
        "meal_datetime": "2026-02-18T12:00:00",
        "unknown_time": true,
        "meal_type": "breast_milk",
        "amount_ml": 200,
        "memo": null
      }
    },
    {
      "record_type": "diaper",
      "record_data": {
        "record_type": "diaper",
        "record_date": "2026-02-18",
        "diaper_datetime": "2026-02-18T12:00:00",
        "unknown_time": true,
        "diaper_type": "stool",
        "condition": "diarrhea",
        "memo": null
      }
    }
  ]
}
```

### POST /api/kids/{kid_id}/records/{type} (기존 API)

- VoiceResultModal에서 "저장" 클릭 시 호출
- `record_data`에서 `record_type` 제거 후 body로 전송

---

## 테스트 예시

| 음성 입력                                 | 기록 유형     | 주요 추출 필드                        |
| ----------------------------------------- | ------------- | ------------------------------------- |
| "아기가 오후 2시에 분유 150ml 먹었어요"   | meal          | formula, 150ml, 14:00                 |
| "두시에서 세시까지 낮잠 잤어요"           | sleep         | nap, 14:00~15:00                      |
| "기저귀 갈았는데 대변 많이 봤어요 초록색" | diaper        | stool, much, green                    |
| "키 75센티 몸무게 9킬로"                  | growth        | 75cm, 9kg                             |
| "열이 나서 해열제 먹였어요"               | health        | fever, antipyretic                    |
| "모유 200ml 먹였고 묽은 변을 봤어"        | meal + diaper | [breast_milk 200ml], [stool diarrhea] |
| (인식 불가)                               | etc           | transcript를 title로                  |

---

## 이전 버전 (로컬 모델)

초기에는 로컬 모델을 사용했으나 메모리/속도 문제로 API로 전환:

| 항목    | 이전 (로컬)                                         | 현재 (API)              |
| ------- | --------------------------------------------------- | ----------------------- |
| STT     | Whisper large-v3-turbo (로컬)                       | gpt-4o-transcribe (API) |
| LLM     | Qwen2.5-1.5B-Instruct (로컬)                        | GPT-4o-mini (API)       |
| 메모리  | ~9GB (MPS float32)                                  | ~0                      |
| 첫 요청 | 30~60초 (모델 로딩)                                 | 즉시                    |
| 의존성  | torch, transformers, accelerate, soundfile, librosa | openai (기존 설치됨)    |
