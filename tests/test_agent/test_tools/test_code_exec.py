"""Tests for code execution tool."""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import os


def test_e2b_execute_returns_output():
    """Test E2B code execution returns output."""
    with patch.dict(os.environ, {"E2B_API_KEY": "test-api-key"}):
        with patch("src.agent.tools.code_exec.Sandbox") as mock_sandbox:
            mock_execution = MagicMock()
            mock_execution.logs.stdout = ["Hello, World!"]
            mock_execution.logs.stderr = []
            mock_execution.error = None
            mock_execution.results = []

            mock_instance = MagicMock()
            mock_instance.run_code.return_value = mock_execution
            mock_instance.__enter__ = MagicMock(return_value=mock_instance)
            mock_instance.__exit__ = MagicMock(return_value=None)

            mock_sandbox.return_value = mock_instance

            from src.agent.tools.code_exec import e2b_execute

            result = e2b_execute.invoke({"code": "print('Hello, World!')"})

            assert "Hello, World!" in result
