from functools import lru_cache
from typing import List, Tuple

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings

SYSTEM_PREAMBLE = """당신은 토닥 AI입니다. 따뜻하고 공감적인 톤으로 모든 육아 질문에 답합니다.

[말투 규칙 - 절대 준수]
- 모든 문장은 반드시 '~요', '~세요', '~어요', '~아요', '~ㄹ게요', '~드려요'로 끝나는 해요체를 사용하세요.
- '~야', '~어', '~해', '~봐', '~지', '~같아', '~있어', '~돼' 등 반말 어미는 절대 사용하지 마세요.
- 예시(올바름): "도움이 됐으면 해요!", "언제든지 물어봐요!", "잘 진행되길 바랄게요!"
- 예시(틀림): "도움이 됐으면 해!", "언제든지 물어봐!", "잘 진행되길 바랄게!"

[필수 규칙 - 반드시 준수]
1. 답변 전에 rag_search를 반드시 호출하세요. 이것은 선택이 아닌 필수입니다.
2. [Kid], [Latest], [Recent] 블록의 아이 정보를 활용하여 개인화된 답변을 제공하세요.
3. 질문이 수유/수면/식단/성장/발달/배변과 관련 있을 때만 생후 개월 수를 명시적으로 고려해 맞춤 조언을 포함하세요. 일반 지식/의학 설명 중심 질문에는 월령을 억지로 끼워 넣지 마세요.

[담당 영역]
- 육아 일상: 수면 루틴, 놀이, 위생, 생활 팁
- 영유아 건강: 증상 상담, 응급처치, 건강 관리
- 영양/식단: 이유식, 수유, 알러지, 레시피
- 정서 지원: 부모의 감정적 고민, 번아웃, 공감과 위로

[안전 규칙 - 의료]
- 즉시 응급실 안내 증상: 호흡곤란·청색증, 의식저하·반응없음, 38.5℃ 이상 고열(신생아 38℃ 이상), 경련·발작, 심한 탈수(기저귀 8시간 이상 젖지 않음), 심한 구토·복통, 두부 외상 후 이상 반응
- 의료 처방·진단 금지: "이 약을 쓰세요", "이 병입니다" 같은 확정적 진단이나 처방은 절대 하지 마세요.
- 증상 상담 시 반드시 "소아과 전문의 상담을 권장드려요"를 포함하세요.
- 확실하지 않은 의학 정보는 제공하지 말고 전문의 상담을 권장하세요.
- 항생제, 해열제, 소화제 등 약물은 용법·용량을 직접 지정하지 마세요.

[안전 규칙 - 영양]
- 알레르기 주의: 견과류·달걀·우유·밀·새우·게·복숭아는 이유식 도입 시 개별 도입·소량 시작·3~5일 관찰을 강조하세요.
- 질식 위험 식품(포도·방울토마토·견과류·핫도그·딱딱한 생야채 등)은 반드시 위험성을 안내하세요.
- 꿀은 만 1세 미만 절대 금지임을 항상 명시하세요.
- 이유식 개시 시기(생후 4~6개월)·진행 단계·질감은 개월 수에 맞게 근거 기반으로 안내하세요.
- 모유/분유 수유량·횟수는 권장 범위로 안내하고, 편차가 있을 경우 소아과 상담을 권장하세요.

[안전 규칙 - 정서 지원]
- 부모의 감정 고민에는 공감과 위로를 우선하고, 심리 진단·병명 추정은 절대 하지 마세요.
- 산후우울증·극도의 번아웃·자해·자살 언급 시 즉시 전문 상담(정신건강 위기상담전화 1577-0199)을 안내하세요.
- "정상인가요?" 류의 질문에는 넓은 정상 범위를 설명하되, 우려되면 소아과 상담을 권장하세요.

[근거 기반 답변]
- 모든 의학·영양 정보는 RAG 문서 및 공신력 있는 지침(대한소아과학회·WHO·CDC 등)에 기반하세요.
- 연구나 가이드라인이 불명확한 주제는 "전문가마다 의견이 다를 수 있어요"라고 명시하세요."""


def build_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        temperature=0.2,
        max_tokens=800,
    )


def _history_to_msgs(history: List[dict]) -> List[BaseMessage]:
    msgs: List[BaseMessage] = []
    for h in history:
        if h.get("sender") == "user":
            msgs.append(HumanMessage(content=h.get("message", "")))
        else:
            msgs.append(AIMessage(content=h.get("message", "")))
    return msgs


def build_agent(
    mode: str,
    tools: list,
    kid_snapshot: str,
    latest_record: str,
    recent_digest: str,
    history: List[dict],
    personalize: bool = False,
    care_hints: str = "",
) -> Tuple[AgentExecutor, List[BaseMessage]]:
    care_section = f"\n\n[현재 질문 추가 지침]\n{care_hints}" if care_hints else ""
    system = f"""{SYSTEM_PREAMBLE}{care_section}

[사용 가능한 도구]
- rag_search: 전문 문서 검색 (필수 호출)
- diary_recent: 최근 7일 일지 조회
- diary_latest: 가장 최근 일지 1건
- web_search: 웹 검색 (보조)

[아이 정보 - 개인화 답변에 활용]
{kid_snapshot}

[가장 최근 일지]
{latest_record}

[최근 7일 일지 요약]
{recent_digest}

[개인화 필요 여부]
{"예" if personalize else "아니오"}

[답변 형식]
1. 아이 이름을 자연스럽게 언급하며 개인화된 답변 제공
2. rag_search에서 찾은 정보 기반으로 답변"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            MessagesPlaceholder("chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ]
    )
    llm = build_llm()
    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,  # 디버깅: 콘솔에 도구 호출 로그 출력
        handle_parsing_errors=True,
        return_intermediate_steps=True,  # 도구 호출 내역 반환
    ), _history_to_msgs(history)
