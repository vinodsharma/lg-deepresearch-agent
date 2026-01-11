import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolCallItem } from "./ToolCallItem";

describe("ToolCallItem", () => {
  it("renders tool name and executing status", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="executing"
        args={{ query: "test query" }}
      />
    );

    expect(screen.getByText("Web Search")).toBeInTheDocument();
    expect(screen.getByText("Running...")).toBeInTheDocument();
  });

  it("renders completed status with duration", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="complete"
        args={{ query: "test query" }}
        result={{ results: [1, 2, 3] }}
        durationMs={1200}
      />
    );

    expect(screen.getByText("1.2s")).toBeInTheDocument();
  });

  it("shows key argument when provided", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="complete"
        args={{ query: "quantum computing" }}
        keyArgument="quantum computing"
        result={{ results: [] }}
      />
    );

    expect(screen.getByText(/"quantum computing"/)).toBeInTheDocument();
  });

  it("shows result summary for search", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="complete"
        args={{ query: "test" }}
        result={{ results: [1, 2, 3, 4, 5] }}
        resultSummary="Found 5 results"
      />
    );

    expect(screen.getByText("Found 5 results")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="error"
        args={{ query: "test" }}
        error="Network timeout"
      />
    );

    expect(screen.getByText("Network timeout")).toBeInTheDocument();
  });

  it("shows query prominently for search tools", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="executing"
        args={{ query: "LangGraph architecture 2025" }}
        keyArgument="LangGraph architecture 2025"
      />
    );

    // Key argument should be in quotes and prominent
    expect(screen.getByText(/"LangGraph architecture 2025"/)).toBeInTheDocument();
  });

  it("shows URL prominently for fetch tools", () => {
    render(
      <ToolCallItem
        name="Fetch Page"
        status="executing"
        args={{ url: "https://docs.example.com/api" }}
        keyArgument="https://docs.example.com/api"
      />
    );

    expect(screen.getByText(/docs\.example\.com/)).toBeInTheDocument();
  });

  it("truncates long key arguments with ellipsis", () => {
    const longQuery = "a".repeat(120);
    render(
      <ToolCallItem
        name="Web Search"
        status="executing"
        args={{ query: longQuery }}
        keyArgument={longQuery}
      />
    );

    // Should truncate to ~100 chars
    expect(screen.getByText(/\.\.\."/)).toBeInTheDocument();
  });
});
