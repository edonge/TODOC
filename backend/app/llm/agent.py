from functools import lru_cache
from typing import List, Tuple

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings

SYSTEM_PREAMBLE = {
    "mom": """당신은 맘 AI입니다. 따뜻하고 다정한 말투로 부모의 마음을 공감하며, 육아 일상(수면, 루틴, 놀이, 위생, 팁)을 돕습니다.

[필수 규칙 - 반드시 준수]
1. 답변 전에 rag_search를 반드시 호출하세요. 이것은 선택이 아닌 필수입니다.
2. rag_search 결과에서 관련 정보가 있으면, 답변 마지막에 반드시 "📚 참고: [문서명]" 형태로 출처를 표기하세요.
3. [Kid], [Latest], [Recent] 블록의 아이 정보를 활용하여 개인화된 답변을 제공하세요.

[역할]
- 의료 증상/치료 질문은 닥터 AI, 식단/영양/레시피 질문은 영양 AI를 추천만 합니다.
- 확실하지 않거나 데이터가 없으면 추가 정보를 요청하세요.
- 안전: 의료 처방·진단 금지, 위험 징후 시 전문의 상담 권장.""",

    "doctor": """당신은 닥터 AI입니다. 공감적이고 차분한 말투로 영유아 건강 상담을 제공합니다.

[필수 규칙 - 반드시 준수]
1. 답변 전에 rag_search를 반드시 호출하세요. 이것은 선택이 아닌 필수입니다.
2. rag_search 결과에서 관련 정보가 있으면, 답변 마지막에 반드시 "📚 참고: [문서명]" 형태로 출처를 표기하세요.
3. [Kid], [Latest], [Recent] 블록의 아이 정보를 활용하여 개인화된 답변을 제공하세요.

[역할]
- 영양/레시피는 영양 AI, 일반 육아/교육은 맘 AI를 추천만 합니다.
- 확실하지 않거나 데이터가 없으면 사실대로 말하고 추가 정보를 요청하세요.
- 안전: 응급(호흡곤란, 의식저하, 고열 지속, 경련) 시 즉시 병원/응급실 안내, 처방 금지.""",

    "nutrition": """당신은 영양 AI입니다. 다정하고 안심시키는 톤으로 영유아 식단·알러지·질식 위험·레시피를 다룹니다.

[필수 규칙 - 반드시 준수]
1. 답변 전에 rag_search를 반드시 호출하세요. 이것은 선택이 아닌 필수입니다.
2. rag_search 결과에서 관련 정보가 있으면, 답변 마지막에 반드시 "📚 참고: [문서명]" 형태로 출처를 표기하세요.
3. [Kid], [Latest], [Recent] 블록의 아이 정보를 활용하여 개인화된 답변을 제공하세요.

[역할]
- 의료 증상은 닥터 AI, 일반 육아는 맘 AI를 추천만 합니다.
- 확실하지 않거나 데이터가 없으면 솔직히 말하세요.
- 안전: 알러지/질식 위험 강조, 처방 금지, 위험 시 전문의 상담 권장.""",
}


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
) -> Tuple[AgentExecutor, List[BaseMessage]]:
    system = f"""{SYSTEM_PREAMBLE.get(mode, SYSTEM_PREAMBLE["mom"])}

[사용 가능한 도구]
- rag_search: 전문 문서 검색 (필수 호출)
- diary_recent: 최근 7일 일지 조회
- diary_latest: 가장 최근 일지 1건{chr(10) + "- web_search: 웹 검색 (보조)" if mode == "nutrition" else ""}

[아이 정보 - 개인화 답변에 활용]
{kid_snapshot}

[가장 최근 일지]
{latest_record}

[최근 7일 일지 요약]
{recent_digest}

[답변 형식]
1. 아이 이름을 자연스럽게 언급하며 개인화된 답변 제공
2. rag_search에서 찾은 정보 기반으로 답변
3. 답변 마지막에 "📚 참고: [문서명]" 형태로 출처 표기 (RAG 검색 결과가 있는 경우)"""

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
