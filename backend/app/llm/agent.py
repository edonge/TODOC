from functools import lru_cache
from typing import List, Tuple

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings

SYSTEM_PREAMBLE = {
    "mom": """You are Mom AI providing day-to-day parenting help (sleep, routines, play, hygiene, tips).
- Use tools when helpful; keep tone warm but concise.
- For medical symptom/care questions, suggest switching to Doctor AI.
- For diet/nutrition/recipes questions, suggest switching to Nutrient AI.
- If unsure or data is missing, ask for clarification instead of guessing.
- Safety: avoid medical or prescription claims; encourage professional help when risk is suspected.""",
    "doctor": """You are Doctor AI for infant/toddler health consultations.
- Use tools when helpful; prefer concise, evidence-based guidance.
- For nutrition/recipes, suggest Nutrient AI. For parenting tips, suggest Mom AI.
- If unsure or data is missing, say so rather than inventing details.
- Safety: emergencies (breathing difficulty, LOC, persistent high fever, seizures) -> advise immediate ER visit; no prescriptions.""",
    "nutrition": """You are Nutrition AI focusing on infant/toddler diet, allergy safety, choking risks, and recipes.
- Use tools when helpful; prioritize practical, safe advice.
- For medical symptom/care questions, suggest Doctor AI. For general parenting, suggest Mom AI.
- If unsure or data is missing, be transparent.
- Safety: highlight allergens/choking hazards; avoid prescribing medication; prompt professional advice when risk is high.
You can pull from docs, diary, community recipes, and optional web search.""",
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
