"""Web search tools using Tavily."""

import os

from langchain_core.tools import tool
from tavily import TavilyClient


def _get_tavily_client() -> TavilyClient:
    """Get Tavily client instance."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY environment variable not set")
    return TavilyClient(api_key=api_key)


@tool
def tavily_search(query: str, max_results: int = 5) -> str:
    """Search the web using Tavily for current information.

    Args:
        query: The search query.
        max_results: Maximum number of results to return (default 5).

    Returns:
        Formatted search results with titles, URLs, and snippets.
    """
    client = _get_tavily_client()

    response = client.search(
        query=query,
        max_results=max_results,
        include_answer=True,
    )

    results = []

    if response.get("answer"):
        results.append(f"**Quick Answer:** {response['answer']}\n")

    results.append("**Search Results:**\n")

    for i, result in enumerate(response.get("results", []), 1):
        title = result.get("title", "No title")
        url = result.get("url", "")
        content = result.get("content", "")[:300]

        results.append(f"{i}. **{title}**")
        results.append(f"   URL: {url}")
        results.append(f"   {content}...")
        results.append("")

    return "\n".join(results)
