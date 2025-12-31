"""Sandboxed code execution using E2B."""

import os

from e2b_code_interpreter import Sandbox
from langchain_core.tools import tool


@tool
def e2b_execute(code: str, timeout: int = 60) -> str:
    """Execute Python code in a secure E2B sandbox.

    Use this for data analysis, calculations, chart generation, or any
    code that needs to run safely in isolation.

    Args:
        code: Python code to execute.
        timeout: Maximum execution time in seconds (default 60).

    Returns:
        Execution output including stdout, stderr, and any generated artifacts.
    """
    api_key = os.getenv("E2B_API_KEY")
    if not api_key:
        return "Error: E2B_API_KEY environment variable not set"

    try:
        with Sandbox(api_key=api_key, timeout=timeout) as sandbox:
            execution = sandbox.run_code(code)

            output_parts = []

            # Collect stdout
            if execution.logs.stdout:
                stdout = "".join(execution.logs.stdout)
                output_parts.append(f"**Output:**\n```\n{stdout}\n```")

            # Collect stderr
            if execution.logs.stderr:
                stderr = "".join(execution.logs.stderr)
                output_parts.append(f"**Errors:**\n```\n{stderr}\n```")

            # Check for execution error
            if execution.error:
                output_parts.append(f"**Execution Error:**\n{execution.error}")

            # Collect results (charts, dataframes, etc.)
            if execution.results:
                for i, result in enumerate(execution.results):
                    if hasattr(result, "png") and result.png:
                        output_parts.append(f"**Chart {i + 1}:** [Image generated]")
                    elif hasattr(result, "text") and result.text:
                        output_parts.append(f"**Result {i + 1}:**\n{result.text}")

            if not output_parts:
                return "Code executed successfully with no output."

            return "\n\n".join(output_parts)

    except Exception as e:
        return f"Error executing code: {str(e)}"
