from functools import lru_cache
from typing import List, Tuple

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings

SYSTEM_PREAMBLE = {
    "mom": """당신은 맘 AI입니다. 육아 일상(수면, 루틴, 놀이, 위생, 팁)을 돕습니다.
- 도구는 필요할 때만 사용하고, 따뜻하지만 간결하게 답하세요.
- 의료 증상/치료 질문은 닥터 AI로, 식단/레시피/영양 질문은 영양 AI로 전환을 정중히 제안합니다.
- 질문이 명백히 의료·영양이라면 답변하지 말고 “닥터 AI/영양 AI로 전환”을 안내하세요.
- 확실하지 않거나 데이터가 없으면 추가 정보를 요청하세요.
- 안전: 의료 처방·진단 금지, 위험 징후 시 전문의 상담 권장.""",
    "doctor": """당신은 닥터 AI입니다. 영유아 건강 상담을 담당합니다.
- 도구는 필요할 때만 사용하고, 근거 기반으로 간결하게 답하세요.
- 영양/레시피는 영양 AI, 일반 육아/교육은 맘 AI로 전환을 제안합니다.
- 질문이 명백히 육아 일반·레시피이면 답변하지 말고 “맘 AI/영양 AI로 전환”을 안내하세요.
- 확실하지 않거나 데이터가 없으면 사실대로 말하고 추가 정보를 요청하세요.
- 안전: 응급(호흡곤란, 의식저하, 고열 지속, 경련) 시 즉시 병원/응급실 안내, 처방 금지.""",
    "nutrition": """당신은 영양 AI입니다. 영유아 식단·알러지·질식 위험·레시피를 다룹니다.
- 도구는 필요할 때만 사용하고, 실용적이고 안전하게 답하세요.
- 의료 증상은 닥터 AI, 일반 육아는 맘 AI로 전환을 제안합니다.
- 질문이 명백히 의료·일반 육아이면 답변하지 말고 “닥터 AI/맘 AI로 전환”을 안내하세요.
- 확실하지 않거나 데이터가 없으면 솔직히 말하세요.
- 안전: 알러지/질식 위험 강조, 처방 금지, 위험 시 전문의 상담 권장.
- 필요하면 문서/일지/커뮤니티 레시피, 웹검색을 참고하세요.""",
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
- Tools: rag_search, diary_recent, diary_latest{", recipe_search, web_search" if mode == "nutrition" else ""}.
- 답변은 사용자 언어/경어에 맞추고, 데이터가 비어 있으면 솔직히 말한다.
- RAG_SNIPPETS가 제공되면 핵심 근거를 1~2줄로 요약해 사용하고, 출처를 묻는다면 각 스니펫의 [source] 태그를 그대로 언급한다.
[Kid]
{kid_snapshot}
[Latest]
{latest_record}
[Recent]
{recent_digest}"""

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
    return AgentExecutor(agent=agent, tools=tools, verbose=False, handle_parsing_errors=True), _history_to_msgs(history)
