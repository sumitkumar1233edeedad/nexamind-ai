import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure stdout uses utf-8 encoding on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

from chating.agent import get_agent, TOOLS
from langchain_core.messages import HumanMessage

def test_nexamind_cli():
    print("=" * 60)
    print("NexaMind AI (LangGraph + LangChain + OpenRouter gpt-4o-mini)")
    print("=" * 60)
    print(f"Loaded {len(TOOLS)} Tools: {[t.name for t in TOOLS]}")
    
    agent = get_agent()
    
    sample_queries = [
        "What is 12345 * 6789?",
        "What is the current date and time?",
    ]
    
    for q in sample_queries:
        print(f"\nQuery: {q}")
        print("-" * 50)
        res = agent.invoke({"messages": [HumanMessage(content=q)]})
        print(f"Response:\n{res['messages'][-1].content}\n")

if __name__ == "__main__":
    test_nexamind_cli()