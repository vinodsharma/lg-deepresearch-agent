"""URL fetching and content extraction tools."""

import httpx
from langchain_core.tools import tool
from markdownify import markdownify as md


@tool
async def fetch_url(url: str, max_length: int = 50000) -> str:
    """Fetch a URL and convert its content to markdown.

    Args:
        url: The URL to fetch.
        max_length: Maximum content length to return (default 50000).

    Returns:
        The page content converted to markdown format.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DeepResearchAgent/1.0)"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            html_content = response.text

            # Convert HTML to markdown
            markdown_content = md(
                html_content,
                heading_style="ATX",
                strip=["script", "style", "nav", "footer", "header"],
            )

            # Clean up excessive whitespace
            lines = [line.strip() for line in markdown_content.split("\n")]
            cleaned = "\n".join(line for line in lines if line)

            # Truncate if necessary
            if len(cleaned) > max_length:
                cleaned = cleaned[:max_length] + "\n\n[Content truncated...]"

            return f"**Source:** {url}\n\n{cleaned}"

    except httpx.HTTPStatusError as e:
        return f"Error fetching URL: HTTP {e.response.status_code}"
    except httpx.RequestError as e:
        return f"Error fetching URL: {str(e)}"
