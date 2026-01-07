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

  it("shows args summary", () => {
    render(
      <ToolCallItem
        name="Web Search"
        status="complete"
        args={{ query: "quantum computing" }}
        result={{ results: [] }}
      />
    );

    expect(screen.getByText(/quantum computing/)).toBeInTheDocument();
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
});
