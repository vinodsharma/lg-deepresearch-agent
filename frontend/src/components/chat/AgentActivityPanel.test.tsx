// frontend/src/components/chat/AgentActivityPanel.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentActivityPanel } from "./AgentActivityPanel";
import { ToolCall } from "./ToolCallAccordion";

describe("AgentActivityPanel", () => {
  it("renders nothing when no activity", () => {
    const { container } = render(
      <AgentActivityPanel toolCalls={[]} thinking="" isWorking={false} />
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("renders thinking section when present", () => {
    render(
      <AgentActivityPanel
        toolCalls={[]}
        thinking="Planning the search strategy"
        isWorking={true}
      />
    );

    expect(screen.getByText("Agent Thinking")).toBeInTheDocument();
  });

  it("renders tool calls when present", () => {
    const toolCalls: ToolCall[] = [
      { id: "1", name: "tavily_search", displayName: "Web Search", status: "complete", args: {} },
    ];

    render(
      <AgentActivityPanel
        toolCalls={toolCalls}
        thinking=""
        isWorking={false}
      />
    );

    expect(screen.getByText("Tools Used (1)")).toBeInTheDocument();
  });

  it("expands accordions when working", () => {
    const toolCalls: ToolCall[] = [
      { id: "1", name: "tavily_search", displayName: "Web Search", status: "executing", args: { query: "test" } },
    ];

    render(
      <AgentActivityPanel
        toolCalls={toolCalls}
        thinking="Searching..."
        isWorking={true}
      />
    );

    // Content should be visible when expanded
    expect(screen.getByText(/query/)).toBeInTheDocument();
  });
});
