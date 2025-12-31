"""Tests for file analysis tools."""

import pytest
from unittest.mock import patch, MagicMock
import io


def test_analyze_pdf_extracts_text():
    """Test PDF text extraction."""
    with patch("src.agent.tools.files.fitz") as mock_fitz:
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Test PDF content"

        mock_doc = MagicMock()
        mock_doc.__iter__ = lambda self: iter([mock_page])
        mock_doc.__len__ = lambda self: 1

        mock_fitz.open.return_value = mock_doc

        from src.agent.tools.files import analyze_pdf

        result = analyze_pdf.invoke({"file_path": "/tmp/test.pdf"})

        assert "Test PDF content" in result
