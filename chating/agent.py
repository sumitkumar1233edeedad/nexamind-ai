import os
import math
from datetime import datetime
from typing import Annotated, Sequence, List
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
)
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from tavily import TavilyClient

# Ensure environment variables are loaded
load_dotenv()


# =====================================================================
# Tools Definition
# =====================================================================

@tool
def calculate(expression: str) -> str:
    """Calculate the numerical result of a mathematical expression.
    Supports basic arithmetic (+, -, *, /, //, %, **) and math functions:
    sqrt, sin, cos, tan, log, log10, pow, ceil, floor, factorial, pi, e.
    Example: '4532 * 879' or 'sqrt(144) + 10' or 'pow(2, 8)'.
    """
    safe_dict = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
    safe_dict["abs"] = abs
    safe_dict["round"] = round
    safe_dict["min"] = min
    safe_dict["max"] = max

    try:
        cleaned = expression.strip()
        # Evaluate safely without builtins
        val = eval(cleaned, {"__builtins__": None}, safe_dict)
        return str(val)
    except Exception as e:
        return f"Error evaluating expression '{expression}': {e}"


@tool
def web_search(query: str) -> str:
    """Search the web for up-to-date information, current news, facts, and live data using Tavily.
    Use this whenever answering questions that require current real-world knowledge,
    recent events, or external verification.
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    if not tavily_key:
        return "Tavily API key is not configured. Please set TAVILY_API_KEY in your .env file."

    try:
        client = TavilyClient(api_key=tavily_key)
        response = client.search(query=query, max_results=4, search_depth="basic")
        results = []
        for r in response.get("results", []):
            title = r.get("title", "Untitled")
            url = r.get("url", "")
            content = r.get("content", "")
            results.append(f"**[{title}]({url})**\n{content}")

        if not results:
            return "No relevant search results found."

        return "\n\n".join(results)
    except Exception as e:
        return f"Tavily search error: {e}"


@tool
def get_current_datetime() -> str:
    """Returns the current date, time, and day of the week in real-time."""
    now = datetime.now()
    return now.strftime("%A, %B %d, %Y at %I:%M %p")


# Register tools
TOOLS = [web_search, calculate, get_current_datetime]


# =====================================================================
# LLM & LangGraph Agent Architecture
# =====================================================================

SYSTEM_PROMPT = (
    "You are NexaMind, an intelligent, versatile, and highly capable AI assistant.\n"
    "You are built using LangChain and LangGraph with state-of-the-art tool orchestration.\n\n"
    "Your Available Tools:\n"
    "1. `web_search`: Search the live web using Tavily for real-time information, latest news, and verified facts.\n"
    "2. `calculate`: Accurately evaluate mathematical expressions and computations.\n"
    "3. `get_current_datetime`: Look up the current date, time, and day of the week.\n\n"
    "Core Instructions:\n"
    "- If a query asks about real-time, recent events, live statistics, or facts you need to verify, use `web_search`.\n"
    "- When web search is used, cite sources with markdown links [Title](URL).\n"
    "- If a query involves mathematical calculation, always use the `calculate` tool to ensure 100% precision.\n"
    "- Always answer clearly, politely, and structure your responses with rich Markdown (headings, lists, bold text, code blocks).\n"
    "- If writing code, provide complete, working code blocks with language indicators.\n"
)


def get_llm():
    """Initializes and returns the ChatOpenAI model configured for OpenRouter."""
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("openrouter_api_key")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set in environment or .env file.")

    return ChatOpenAI(
        model="openai/gpt-4o-mini",
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.5,
    )


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


def build_nexamind_graph():
    """Constructs and compiles the native LangGraph ReAct agent workflow."""
    llm = get_llm()
    model_with_tools = llm.bind_tools(TOOLS)

    def call_model(state: AgentState):
        response = model_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(TOOLS))

    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", tools_condition)
    workflow.add_edge("tools", "agent")

    return workflow.compile()


# Lazy-load agent instance
_agent_instance = None


def get_agent():
    """Returns singleton instance of the compiled LangGraph agent."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = build_nexamind_graph()
    return _agent_instance


# =====================================================================
# Response Generation with Memory
# =====================================================================

def generate_chat_response(conversation, user_input: str) -> str:
    """Generates an AI response using the LangGraph agent with conversation history.

    Args:
        conversation: Django Conversation model instance
        user_input: The current user message string

    Returns:
        str: AI response text in Markdown format
    """
    try:
        agent = get_agent()
    except Exception as e:
        return f"⚠️ Configuration error: {str(e)}"

    messages: List[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]

    # Fetch recent conversation history (last 10 messages for rich multi-turn context)
    if conversation:
        past_messages = conversation.messages.order_by("created_at")
        count = past_messages.count()
        if count > 10:
            past_messages = past_messages[count - 10:]

        for msg in past_messages:
            if msg.user_input:
                messages.append(HumanMessage(content=msg.user_input))
            if msg.reply:
                messages.append(AIMessage(content=msg.reply))

    # Add the current user query
    messages.append(HumanMessage(content=user_input))

    try:
        result = agent.invoke({"messages": messages})
        final_message = result["messages"][-1]
        
        if isinstance(final_message.content, str):
            return final_message.content
        elif isinstance(final_message.content, list):
            # Sometimes multi-part content
            text_parts = [
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in final_message.content
            ]
            return "".join(text_parts)
        else:
            return str(final_message.content)

    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "User not found" in error_msg or "key" in error_msg.lower():
            return f"⚠️ OpenRouter Authentication Error: Please verify your `OPENROUTER_API_KEY` in `.env`. Details: {error_msg}"
        return f"⚠️ NexaMind encountered an issue generating a response: {error_msg}"
