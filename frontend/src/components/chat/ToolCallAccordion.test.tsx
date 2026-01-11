// frontend/src/components/chat/ToolCallAccordion.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolCallAccordion, ToolCall } from "./ToolCallAccordion";

describe("ToolCallAccordion", () => {
  it("renders nothing when no tool calls", () => {
    const { container } = render(<ToolCallAccordion toolCalls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders tool count in header", () => {
    const toolCalls: ToolCall[] = [
      { id: "1", name: "tavily_search", displayName: "Web Search", status: "complete", args: {} },
      { id: "2", name: "fetch_url", displayName: "Fetch Page", status: "executing", args: {} },
    ];

    render(<ToolCallAccordion toolCalls={toolCalls} expanded={true} />);

    expect(screen.getByText("Tools Used (2)")).toBeInTheDocument();
  });

  it("renders each tool call", () => {
    const toolCalls: ToolCall[] = [
      { id: "1", name: "tavily_search", displayName: "Web Search", status: "complete", args: { query: "test" } },
    ];

    render(<ToolCallAccordion toolCalls={toolCalls} expanded={true} />);

    expect(screen.getByText("Web Search")).toBeInTheDocument();
  });

  it("passes keyArgument to ToolCallItem", () => {
    render(
      <ToolCallAccordion
        toolCalls={[
          {
            id: "1",
            name: "tavily_search",
            displayName: "Web Search",
            status: "executing",
            args: { query: "test query" },
            keyArgument: "test query",
          },
        ]}
        expanded={true}
      />
    );

    expect(screen.getByText(/"test query"/)).toBeInTheDocument();
  });
});
