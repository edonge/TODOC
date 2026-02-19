# Speech-to-Text (S2T) 기능 플로우

TODOC 앱에는 음성 입력이 가능한 진입점이 **3곳** 있다. 각 진입점마다 목적이 다르고 백엔드 파이프라인 분기도 다르다.

---

## 음성 입력 진입점 3가지

| 진입점                | 컴포넌트                                   | API 파라미터            | 목적              | 결과                      |
| --------------------- | ------------------------------------------ | ----------------------- | ----------------- | ------------------------- |
| 홈 마이크             | `VoiceRecordButton` (`onAiChat` prop 있음) | `?classify=true`        | 기록 또는 AI 질문 | intent에 따라 분기        |
| 기록 추가 모달 마이크 | `VoiceRecordButton` (`onAiChat` prop 없음) | (파라미터 없음)         | 기록 추가 전용    | 항상 VoiceResultModal     |
| 채팅 입력창 마이크    | `ChatInput`                                | `?transcript_only=true` | AI 채팅 전사 전용 | 텍스트만 반환 → 채팅 전송 |

---

## 진입점별 전체 플로우

### 1. 홈 마이크 → 인텐트 분류 → 기록 또는 AI 채팅

```
[홈 화면 마이크 버튼]
       ↓ 사용자 음성 녹음 (최대 60초, audio/webm)
POST /api/speech/transcribe/{kid_id}?classify=true
       ↓
┌──────────────────────────────────────┐
│  Step 1: OpenAI Whisper              │  ← audio → Korean text
│     model: "gpt-4o-transcribe"       │
│     language: "ko"                   │
└──────────────────────────────────────┘
       ↓ transcript
┌──────────────────────────────────────┐
│  Step 1b: classify_intent()          │  ← gpt-4o-mini (temp=0, max_tokens=5)
│     RECORD or AI_CHAT                │
└──────────────────────────────────────┘
       ↓
   ┌───────────────────────────────────────┐
   │ intent == "AI_CHAT"                   │
   │   → { transcript, intent: "AI_CHAT"   │
   │       records: [] }                   │
   │   → VoiceRecordButton: onAiChat()     │
   │   → navigate('/ai/chat',              │
   │       { state: { initialMessage } })  │
   │   → AiChatPage: auto-submit message   │
   └───────────────────────────────────────┘
       ↓ intent == "RECORD"
┌──────────────────────────────────────────────────────────┐
│  Step 2: LLM record extraction (gpt-4o-mini, temp=0.1)   │
│  Step 3: JSON parsing (array or single object)           │
│  Step 4: validation + clamping                           │
└──────────────────────────────────────────────────────────┘
       ↓
{ transcript, intent: "RECORD", records: [...] }
       ↓
VoiceRecordButton: onResult() → VoiceResultModal
       ↓ 사용자 "저장" 클릭
POST /api/kids/{kid_id}/records/{type}  ← DB 저장
```

### 2. 기록 추가 모달 마이크 → 항상 기록 추출

```
[RecordCategoryModal 하단 마이크 버튼]
       ↓
POST /api/speech/transcribe/{kid_id}   (파라미터 없음)
       ↓
Step 1: Whisper → transcript
Step 2: LLM extraction (gpt-4o-mini)
Step 3: JSON 파싱
Step 4: 유효성 검증
       ↓
{ transcript, intent: "RECORD", records: [...] }
       ↓
onResult() → VoiceResultModal (항상)
```

> `onAiChat` prop이 없으므로 인텐트 분류 자체가 실행되지 않는다.
> 기록 추가 모달에서는 AI 채팅으로 라우팅되면 안 되기 때문에 의도적 설계.

### 3. 채팅 입력창 마이크 → 전사만 반환

```
[AiChatPage ChatInput 내 마이크 아이콘]
       ↓
POST /api/speech/transcribe/{kid_id}?transcript_only=true
       ↓
Step 1: Whisper → transcript
       ↓ (LLM extraction 완전 생략)
{ transcript, intent: "TRANSCRIPT_ONLY", records: [] }
       ↓
onVoiceInput(transcript)
       ↓
handleSend(transcript)  → AI 채팅 메시지로 전송
```

> record extraction을 생략하므로 latency 감소.
> 다이어리 기록이 절대 생성되지 않는다 — `records`가 항상 빈 배열.

---

## 백엔드 파이프라인 상세

### 전체 분기 다이어그램

```
process_speech_to_record(audio_bytes, audio_suffix, classify, transcript_only)
       ↓
Step 0: load_models() (lazy, 첫 요청 시에만)
       ↓
Step 1: transcribe() → Whisper API
       ↓ transcript
┌────────────────────────────────┐
│ transcript_only=True?          │
│   → return TRANSCRIPT_ONLY     │  ← chat input mic
└────────────────────────────────┘
       ↓ No
┌────────────────────────────────┐
│ classify=True?                 │
│   → classify_intent()          │
│     AI_CHAT → return AI_CHAT   │  ← home mic (AI question)
│     RECORD → continue          │
└────────────────────────────────┘
       ↓ RECORD
Step 2: 시스템 프롬프트 생성 (현재 날짜/시각 주입)
Step 3: llm_extract() → gpt-4o-mini
Step 4: _parse_json() (배열 or 단일 객체)
Step 5: validate_record_data() × N건
       ↓
return { transcript, intent: "RECORD", records: [...] }
```

### classify_intent()

```python
async def classify_intent(transcript: str) -> str:
    """음성 텍스트를 'RECORD' 또는 'AI_CHAT'으로 분류. 실패 시 'RECORD' 반환."""
    system = """You are an intent classifier for a baby health tracking app.
Classify the user voice input as either:
- RECORD: the user wants to log health data, symptoms, meals, sleep, diaper, or daily records.
- AI_CHAT: the user is asking a question, seeking advice, or starting a conversation.
Respond with only one word: RECORD or AI_CHAT."""

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        max_tokens=5,
        messages=[{"role":"system","content":system},
                  {"role":"user","content":transcript}],
    )
    word = resp.choices[0].message.content.strip().upper()
    return "AI_CHAT" if "AI_CHAT" in word else "RECORD"
    # 예외 발생 시 "RECORD" 반환 (안전한 폴백)
```

**판별 예시**

| 음성                              | intent  |
| --------------------------------- | ------- |
| "분유 150ml 먹였어"               | RECORD  |
| "낮잠 두시간 잤어"                | RECORD  |
| "이 월령에 이유식 언제 시작해?"   | AI_CHAT |
| "열이 나면 어떻게 해야 해?"       | AI_CHAT |
| "아기가 잘 안자는데 왜 그럴까요?" | AI_CHAT |

---

## 사용 모델

| 단계        | 모델                     | 용도                  | API                                    |
| ----------- | ------------------------ | --------------------- | -------------------------------------- |
| STT         | `gpt-4o-transcribe`      | 한국어 음성 → 텍스트  | `client.audio.transcriptions.create()` |
| 인텐트 분류 | `gpt-4o-mini` (temp=0.0) | RECORD / AI_CHAT 분류 | `client.chat.completions.create()`     |
| 기록 추출   | `gpt-4o-mini` (temp=0.1) | 텍스트 → 구조화 JSON  | `client.chat.completions.create()`     |

모두 OpenAI API 사용 (동일한 `OPENAI_API_KEY`, `_get_client()` 싱글턴 재사용).

---

## 백엔드 파일 구조

```
backend/app/stt/
├── __init__.py
├── models.py      ← OpenAI API 호출 (Whisper + Chat), _get_client() 싱글턴
├── prompt.py      ← gpt-4o-mini 기록 추출용 시스템 프롬프트
└── service.py     ← 파이프라인 오케스트레이션, classify_intent(), JSON 파싱, 유효성 검증

backend/app/api/
└── speech.py      ← POST /api/speech/transcribe/{kid_id} 엔드포인트
```

---

## API 엔드포인트

### POST /api/speech/transcribe/{kid_id}

- **인증**: JWT Bearer token 필수
- **입력**: `UploadFile` (audio/webm 권장, 최대 10MB)
- **쿼리 파라미터**:
  - `classify=true` — Whisper 후 인텐트 분류 실행 (홈 마이크 전용)
  - `transcript_only=true` — Whisper 후 record extraction 생략 (채팅 마이크 전용)
  - (파라미터 없음) — 전체 파이프라인 (기록 모달 마이크)
- **검증**: kid 소유권 확인 (`kid_crud.get_kid_by_user`)
- **지원 오디오 형식**: webm, wav, mp4/m4a, mp3, ogg

**응답 구조 (공통)**:

```json
{
  "transcript": "...",
  "intent": "RECORD | AI_CHAT | TRANSCRIPT_ONLY",
  "records": [...]
}
```

**응답 예시 — 단일 기록**:

```json
{
  "transcript": "두시에서 세시까지 낮잠 잤어요",
  "intent": "RECORD",
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

**응답 예시 — 복수 기록**:

```json
{
  "transcript": "모유 200ml 먹였고 묽은 변을 봤어",
  "intent": "RECORD",
  "records": [
    {
      "record_type": "meal",
      "record_data": {
        "record_type": "meal",
        "record_date": "2026-02-18",
        "meal_datetime": "2026-02-18T12:00:00",
        "unknown_time": true,
        "meal_type": "breast_milk",
        "amount_ml": 200
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
        "condition": "diarrhea"
      }
    }
  ]
}
```

**응답 예시 — AI_CHAT intent**:

```json
{
  "transcript": "이 월령에 이유식 언제 시작해?",
  "intent": "AI_CHAT",
  "records": []
}
```

**응답 예시 — transcript_only**:

```json
{
  "transcript": "수면 패턴이 왜 이렇게 불규칙할까요?",
  "intent": "TRANSCRIPT_ONLY",
  "records": []
}
```

---

## 프론트엔드 구현

### VoiceRecordButton.jsx

진입점: 홈 화면, 기록 추가 모달

```javascript
function VoiceRecordButton({ kidId, onResult, inline = false, className = '', onAiChat = null })
```

**상태 머신**: `idle → recording → processing → idle`

**핵심 로직 — handleRecordingComplete()**:

```javascript
// onAiChat prop 유무로 엔드포인트 분기
const url = onAiChat
  ? `/api/speech/transcribe/${kidId}?classify=true` // 홈 마이크
  : `/api/speech/transcribe/${kidId}`; // 기록 모달 마이크

const result = await response.json();

// 인텐트에 따라 콜백 분기
if (onAiChat && result.intent === "AI_CHAT") {
  onAiChat(result.transcript); // → navigate('/ai/chat', { state: { initialMessage } })
} else {
  onResult(result); // → VoiceResultModal 열기
}
```

**버튼 배치**:

- `inline=true` (홈 화면): 페이지 흐름 내 중앙 배치, 140px 크기
- `inline=false` (기록 모달): 카테고리 그리드 아래 56px 버튼

### ChatInput.jsx

진입점: AiChatPage 채팅 입력창

```javascript
function ChatInput({ placeholder, buttonColor, onSend, disabled, kidId, onVoiceInput })
```

입력창 오른쪽 내부에 절대 위치(absolute)로 마이크 아이콘 배치.

**핵심 로직 — recorder.onstop()**:

```javascript
// 항상 transcript_only=true — record extraction 없음
const res = await apiFetch(
  `/api/speech/transcribe/${kidId}?transcript_only=true`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  },
);
const result = await res.json();
if (result.transcript) onVoiceInput(result.transcript);
// onVoiceInput = AiChatPage의 handleSend
```

**상태 머신**: `idle → recording → processing → idle`

- `recording` 중에는 텍스트 입력창 `disabled`
- 입력창 우측 패딩 40px 확보 (`chat-input-field--with-mic`)

### AiChatPage.jsx — 홈 마이크 연동

홈 화면 마이크로 AI 질문이 인식되면 `/ai/chat`으로 navigate하면서 `location.state.initialMessage`에 transcript를 담는다.

**초기 메시지 pre-population (lazy initializer)**:

```javascript
const [messages, setMessages] = useState(() => {
  const intro = {
    id: "intro",
    sender: "ai",
    text: introText,
    background: meta.bubble,
  };
  const voiceText = !sessionIdParam ? location.state?.initialMessage : null;
  if (voiceText) {
    // 음성 전사 버블을 intro 다음에 즉시 표시
    return [intro, { id: "u-voice-init", sender: "user", text: voiceText }];
  }
  return [intro];
});
```

**자동 전송 (마운트 시 1회)**:

```javascript
const hasAutoSubmitted = useRef(false);
useEffect(() => {
  const initial = location.state?.initialMessage;
  if (initial && !hasAutoSubmitted.current && !sessionIdParam) {
    hasAutoSubmitted.current = true;
    handleSend(initial, { skipAddMessage: true }); // 이미 버블 있으므로 중복 추가 방지
  }
}, []);
```

**loadSession 가드** — voice transcript가 있을 때 메시지 덮어쓰기 방지:

```javascript
// loadSession effect 내부
if (!sessionIdParam) {
  if (!location.state?.initialMessage) {
    // 음성 전사 없을 때만 초기화
    setMessages([intro]);
  }
  setSessionId(null);
  return;
}
```

### HomePage.jsx — 홈 마이크 설정

```javascript
const handleVoiceAiChat = (transcript) => {
  navigate("/ai/chat", { state: { initialMessage: transcript } });
};

<VoiceRecordButton
  kidId={kidId}
  onResult={setVoiceResult} // intent=RECORD → VoiceResultModal
  onAiChat={handleVoiceAiChat} // intent=AI_CHAT → navigate to AI chat
  inline
/>;
```

### VoiceResultModal.jsx

intent=RECORD일 때 표시. 복수 기록 순차 확인.

- 인식된 텍스트 + 추출된 필드를 한국어 라벨로 표시
- enum 값 한국어 변환 (breast_milk → 모유 등)
- `unknown_time: true`인 경우 시간 필드 숨김 (12:00 기본값 미표시)
- 카테고리별 배지 색상
- **복수 기록**: `currentIndex` 기반 순차 모달
  - "저장 후 다음" → 현재 저장 후 다음 레코드
  - "건너뛰기" → 저장 없이 다음
  - 진행 표시: `(1/2)`, `(2/2)`
- 저장: `POST /api/kids/{kidId}/records/{type}` (기존 API 재활용)

---

## service.py 상세

### models.py — API 호출

```python
def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client  # lazy singleton — classify_intent()와 공유

def transcribe(audio_bytes, suffix=".webm"):
    # 임시 파일 생성 → Whisper API → 텍스트 반환 → 임시 파일 삭제
    client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=audio_file,
        language="ko",
    )

def llm_extract(system_prompt, user_text):
    client.chat.completions.create(
        model=settings.openai_model,  # gpt-4o-mini
        messages=[{"role":"system","content":system_prompt},
                  {"role":"user","content":user_text}],
        temperature=0.1,
        max_tokens=512,
    )
```

### 복수 기록 처리

- LLM이 여러 종류의 기록이 감지되면 JSON 배열로 출력
- 예: "모유 200ml 먹였고 묽은 변을 봤어" → `[{meal}, {diaper}]`
- `_parse_json()`: 배열 먼저 탐색, 없으면 단일 객체 폴백
- JSON 파싱 완전 실패 시 → `etc` 레코드 (transcript를 title에 삽입)

### 유효성 검증 항목

- `record_type` 유효하지 않으면 → `etc` 폴백
- `record_date` 없으면 → 오늘 날짜
- enum 값 유효하지 않으면 → `null`
- 숫자 범위 초과 → 클램핑
  - `amount_ml`: 0~500
  - `duration_minutes`: 0~60
  - `height_cm`: 30~140
  - `weight_kg`: 1~45
  - `head_circumference_cm`: 20~62
- 필수 필드 없으면 → 기본값 (meal_type → "other", diaper_type → "stool" 등)

### unknown_time 처리

- 시간 미언급 시 `unknown_time: true` + datetime을 `T12:00:00`으로 설정
- 프론트엔드 VoiceResultModal에서 `unknown_time: true`인 경우 시간 필드 숨김
- 사용자에게 의미 없는 12:00 기본값이 보이지 않도록 처리

---

## 시스템 프롬프트 (prompt.py)

### 지원하는 6가지 기록 유형

#### 1. 식사 (meal)

```json
{
  "record_type": "meal",
  "record_date": "YYYY-MM-DD",
  "meal_datetime": "YYYY-MM-DDTHH:MM:SS",
  "unknown_time": false,
  "meal_type": "breast_milk|formula|bottle|baby_food|snack|other",
  "amount_ml": null,
  "duration_minutes": null,
  "burp": false,
  "memo": null
}
```

- meal_type: 모유=breast_milk, 분유=formula, 젖병=bottle, 이유식=baby_food, 간식=snack

#### 2. 수면 (sleep)

```json
{
  "record_type": "sleep",
  "record_date": "YYYY-MM-DD",
  "sleep_type": "nap|night",
  "start_datetime": "YYYY-MM-DDTHH:MM:SS",
  "end_datetime": "YYYY-MM-DDTHH:MM:SS",
  "sleep_quality": "good|normal|bad|null",
  "memo": null
}
```

#### 3. 배변 (diaper)

```json
{
  "record_type": "diaper",
  "record_date": "YYYY-MM-DD",
  "diaper_datetime": "YYYY-MM-DDTHH:MM:SS",
  "unknown_time": false,
  "diaper_type": "urine|stool|both",
  "amount": "much|normal|little|null",
  "condition": "normal|diarrhea|constipation|null",
  "color": "yellow|brown|green|other|null",
  "memo": null
}
```

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

- activities: reading, walking, bathing, playing, music, exercise, swimming (배열)

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

- symptoms: fever, runny_nose, cough, vomit, diarrhea, rash, headache (배열)
- medicines: antipyretic, painkiller, cold_medicine, antibiotic, ointment, eye_drops (배열)

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

### LLM 출력 규칙

1. 텍스트에서 기록 유형 자동 판별
2. 여러 종류의 기록이 있으면 JSON 배열로 분리 출력
3. 시간 미언급 → `unknown_time=true`, `datetime=T12:00:00`
4. "아까"/"방금" → 현재 시각 -30분
5. 오전/오후 미명시 → 위 시간 변환 규칙 적용
6. 미언급 필드 → null
7. 유형 판단 불가 → `etc` + title에 요약
8. 순수 JSON만 출력 (마크다운 코드블록 금지)

---

## 테스트 예시

### 기록 추출

| 음성 입력                                 | 기록 유형     | 주요 추출 필드                        |
| ----------------------------------------- | ------------- | ------------------------------------- |
| "아기가 오후 2시에 분유 150ml 먹었어요"   | meal          | formula, 150ml, 14:00                 |
| "두시에서 세시까지 낮잠 잤어요"           | sleep         | nap, 14:00~15:00                      |
| "기저귀 갈았는데 대변 많이 봤어요 초록색" | diaper        | stool, much, green                    |
| "키 75센티 몸무게 9킬로"                  | growth        | 75cm, 9kg                             |
| "열이 나서 해열제 먹였어요"               | health        | fever, antipyretic                    |
| "모유 200ml 먹였고 묽은 변을 봤어"        | meal + diaper | [breast_milk 200ml], [stool diarrhea] |
| (인식 불가)                               | etc           | transcript를 title로                  |

### 인텐트 분류

| 음성 입력                             | intent  |
| ------------------------------------- | ------- |
| "분유 150ml 먹였어"                   | RECORD  |
| "낮잠 두시간 잤어"                    | RECORD  |
| "이 월령에 이유식 언제 시작해?"       | AI_CHAT |
| "열이 나면 어떻게 해야 해?"           | AI_CHAT |
| "아기 수면이 왜 이렇게 불규칙할까요?" | AI_CHAT |

---

## 이전 버전 (로컬 모델)

초기에는 로컬 모델을 사용했으나 메모리/속도 문제로 API로 전환:

| 항목    | 이전 (로컬)                                         | 현재 (API)              |
| ------- | --------------------------------------------------- | ----------------------- |
| STT     | Whisper large-v3-turbo (로컬)                       | gpt-4o-transcribe (API) |
| LLM     | Qwen2.5-1.5B-Instruct (로컬)                        | gpt-4o-mini (API)       |
| 메모리  | ~9GB (MPS float32)                                  | ~0                      |
| 첫 요청 | 30~60초 (모델 로딩)                                 | 즉시                    |
| 의존성  | torch, transformers, accelerate, soundfile, librosa | openai (기존 설치됨)    |
