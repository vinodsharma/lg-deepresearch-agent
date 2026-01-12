// frontend/src/hooks/useAgentActivity.test.ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useAgentActivity } from "./useAgentActivity";

describe("useAgentActivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

    // Wait for throttle interval to process the update
    act(() => {
      vi.advanceTimersByTime(200);
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

    // Wait for throttle interval to process the add
    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.completeToolCall("1", { results: [1, 2, 3] });
    });

    // Wait for throttle interval to process the complete
    act(() => {
      vi.advanceTimersByTime(200);
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

    // Wait for throttle interval
    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.toolCalls).toEqual([]);
    expect(result.current.thinking).toBe("");
    expect(result.current.isWorking).toBe(false);
  });
});

describe("useAgentActivity throttling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("batches rapid tool call additions", () => {
    const { result } = renderHook(() => useAgentActivity());

    // Add 5 tools rapidly
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.addToolCall({
          id: `tool-${i}`,
          name: "tavily_search",
          args: { query: `query ${i}` },
        });
      }
    });

    // Before throttle interval fires, updates are pending so array is empty
    expect(result.current.toolCalls).toHaveLength(0);

    // After throttle interval (150ms), all should be present
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.toolCalls.length).toBe(5);
  });
});
