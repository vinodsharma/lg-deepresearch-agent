#!/usr/bin/env python3
"""Run a research query directly using the agent."""

import asyncio
import sys

# Add src to path
sys.path.insert(0, "/home/ubuntu/work/lg-deepresearch-agent")

# dotenv already loaded by the app

from src.agent.graph import HITLMode, create_research_agent
from langchain_core.messages import HumanMessage


async def run_research(query: str):
    """Run a research query and print intermediate results."""
    print(f"Starting research: {query}\n")
    print("=" * 80)

    agent = create_research_agent(hitl_mode=HITLMode.NONE)

    # Stream results with higher recursion limit for complex queries
    config = {"recursion_limit": 150}
    async for event in agent.astream_events(
        {"messages": [HumanMessage(content=query)]},
        version="v2",
        config=config,
    ):
        kind = event.get("event")

        if kind == "on_chat_model_stream":
            content = event.get("data", {}).get("chunk", {})
            if hasattr(content, "content") and content.content:
                print(content.content, end="", flush=True)

        elif kind == "on_tool_start":
            tool_name = event.get("name", "unknown")
            tool_input = event.get("data", {}).get("input", {})
            print(f"\n\n[TOOL: {tool_name}]")
            if isinstance(tool_input, dict):
                for k, v in tool_input.items():
                    print(f"  {k}: {v}")
            else:
                print(f"  input: {tool_input}")
            print()

        elif kind == "on_tool_end":
            output = event.get("data", {}).get("output", "")
            if output:
                output_str = str(output)[:500]
                print(f"[TOOL RESULT]: {output_str}...")
                print()

    print("\n" + "=" * 80)
    print("Research complete!")


if __name__ == "__main__":
    query = "compare langraph and google adk to build modern loop based agent like claude code"
    asyncio.run(run_research(query))
