// frontend/src/hooks/useAgentActivity.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAgentActivity } from "./useAgentActivity";

describe("useAgentActivity", () => {
  it("initializes with empty state", () => {
    const { result } = renderHook(() => useAgentActivity());

    expect(result.current.toolCalls).toEqual([]);
    expect(result.current.thinking).toBe("");
    expect(result.current.isWorking).toBe(false);
  });

  it("adds tool call", () => {
    const { result } = renderHook(() => useAgentActivity());

    act(() => {
      result.current.addToolCall({
        id: "1",
        name: "tavily_search",
        args: { query: "test" },
      });
    });

    expect(result.current.toolCalls).toHaveLength(1);
    expect(result.current.toolCalls[0].name).toBe("tavily_search");
    expect(result.current.toolCalls[0].status).toBe("executing");
    expect(result.current.isWorking).toBe(true);
  });

  it("completes tool call", () => {
    const { result } = renderHook(() => useAgentActivity());

    act(() => {
      result.current.addToolCall({
        id: "1",
        name: "tavily_search",
        args: { query: "test" },
      });
    });

    act(() => {
      result.current.completeToolCall("1", { results: [1, 2, 3] });
    });

    expect(result.current.toolCalls[0].status).toBe("complete");
    expect(result.current.toolCalls[0].resultSummary).toBe("Found 3 results");
  });

  it("sets thinking content", () => {
    const { result } = renderHook(() => useAgentActivity());

    act(() => {
      result.current.setThinking("Planning search strategy");
    });

    expect(result.current.thinking).toBe("Planning search strategy");
  });

  it("resets state", () => {
    const { result } = renderHook(() => useAgentActivity());

    act(() => {
      result.current.addToolCall({ id: "1", name: "test", args: {} });
      result.current.setThinking("test");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.toolCalls).toEqual([]);
    expect(result.current.thinking).toBe("");
    expect(result.current.isWorking).toBe(false);
  });
});
