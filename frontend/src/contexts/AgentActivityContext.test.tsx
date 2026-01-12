import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AgentActivityProvider,
  useAgentActivityContext,
} from "./AgentActivityContext";

function TestConsumer() {
  const { toolCalls, addToolCall, thinking } = useAgentActivityContext();
  return (
    <div>
      <span data-testid="count">{toolCalls.length}</span>
      <span data-testid="thinking">{thinking}</span>
      <button
        onClick={() =>
          addToolCall({ id: "1", name: "tavily_search", args: { query: "test" } })
        }
      >
        Add
      </button>
    </div>
  );
}

describe("AgentActivityContext", () => {
  it("provides agent activity state to children", async () => {
    render(
      <AgentActivityProvider>
        <TestConsumer />
      </AgentActivityProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("throws when used outside provider", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useAgentActivityContext must be used within AgentActivityProvider"
    );

    spy.mockRestore();
  });
});
