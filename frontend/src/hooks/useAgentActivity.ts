// frontend/src/hooks/useAgentActivity.ts
import { useCallback, useEffect, useRef, useState } from "react";

import { ToolCall, ToolCallStatus } from "@/components/chat";

const THROTTLE_INTERVAL_MS = 150;

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  tavily_search: "Web Search",
  fetch_url: "Fetch Page",
  analyze_pdf: "Analyze PDF",
  analyze_document: "Analyze Doc",
  e2b_execute: "Run Code",
  think_tool: "Thinking",
};

const KEY_ARG_FIELDS: Record<string, string> = {
  tavily_search: "query",
  fetch_url: "url",
  analyze_pdf: "url",
  analyze_document: "url",
  e2b_execute: "code",
};

function getKeyArgument(
  toolName: string,
  args: Record<string, unknown>
): string | undefined {
  const field = KEY_ARG_FIELDS[toolName];
  if (!field) return undefined;

  const value = args[field];
  if (typeof value !== "string") return undefined;

  // For code, return just the first line
  if (toolName === "e2b_execute") {
    return value.split("\n")[0];
  }

  return value;
}

function getResultSummary(toolName: string, result: unknown): string {
  if (!result || typeof result !== "object") {
    return "Completed";
  }

  const res = result as Record<string, unknown>;

  switch (toolName) {
    case "tavily_search": {
      const results = res.results;
      if (Array.isArray(results)) {
        return `Found ${results.length} results`;
      }
      return "Search completed";
    }
    case "fetch_url": {
      const content = res.content;
      if (typeof content === "string") {
        const words = content.split(/\s+/).length;
        return `Extracted ${words.toLocaleString()} words`;
      }
      return "Page fetched";
    }
    case "analyze_pdf":
    case "analyze_document": {
      const pages = res.pages;
      if (typeof pages === "number") {
        return `Analyzed ${pages} pages`;
      }
      return "Analysis completed";
    }
    case "e2b_execute": {
      const output = res.output;
      if (typeof output === "string" && output.length > 0) {
        const firstLine = output.split("\n")[0];
        return firstLine.length > 50 ? firstLine.slice(0, 50) + "..." : firstLine;
      }
      return "Execution completed";
    }
    default:
      return "Completed";
  }
}

export interface AddToolCallParams {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface PendingAdd {
  type: "add";
  id: string;
  name: string;
  args: Record<string, unknown>;
  startTime: number;
}

interface PendingComplete {
  type: "complete";
  id: string;
  result: unknown;
  error?: string;
  endTime: number;
}

type PendingUpdate = PendingAdd | PendingComplete;

export interface UseAgentActivityReturn {
  toolCalls: ToolCall[];
  thinking: string;
  isWorking: boolean;
  addToolCall: (params: AddToolCallParams) => void;
  completeToolCall: (id: string, result: unknown, error?: string) => void;
  setThinking: (content: string) => void;
  reset: () => void;
}

export function useAgentActivity(): UseAgentActivityReturn {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [thinking, setThinkingState] = useState("");

  // Use refs for pending updates and start times to avoid re-renders
  const pendingUpdatesRef = useRef<PendingUpdate[]>([]);
  const startTimesRef = useRef<Record<string, number>>({});

  const isWorking = toolCalls.some((tc) => tc.status === "executing");

  // Process pending updates every THROTTLE_INTERVAL_MS
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (pendingUpdatesRef.current.length === 0) return;

      // Take all pending updates
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = [];

      setToolCalls((prev) => {
        let newToolCalls = [...prev];

        for (const update of updates) {
          if (update.type === "add") {
            // Record start time
            startTimesRef.current[update.id] = update.startTime;

            // Add new tool call
            newToolCalls.push({
              id: update.id,
              name: update.name,
              displayName: TOOL_DISPLAY_NAMES[update.name] || update.name,
              status: "executing" as ToolCallStatus,
              args: update.args,
              keyArgument: getKeyArgument(update.name, update.args),
            });
          } else if (update.type === "complete") {
            // Complete existing tool call
            newToolCalls = newToolCalls.map((tc) => {
              if (tc.id !== update.id) return tc;

              const startTime = startTimesRef.current[update.id];
              const durationMs = startTime
                ? update.endTime - startTime
                : undefined;

              return {
                ...tc,
                status: update.error ? "error" : "complete",
                result: update.result,
                resultSummary: update.error
                  ? undefined
                  : getResultSummary(tc.name, update.result),
                error: update.error,
                durationMs,
              };
            });
          }
        }

        return newToolCalls;
      });
    }, THROTTLE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const addToolCall = useCallback((params: AddToolCallParams) => {
    const { id, name, args } = params;

    pendingUpdatesRef.current.push({
      type: "add",
      id,
      name,
      args,
      startTime: Date.now(),
    });
  }, []);

  const completeToolCall = useCallback(
    (id: string, result: unknown, error?: string) => {
      pendingUpdatesRef.current.push({
        type: "complete",
        id,
        result,
        error,
        endTime: Date.now(),
      });
    },
    []
  );

  const setThinking = useCallback((content: string) => {
    setThinkingState((prev) => (prev ? prev + "\n\n" + content : content));
  }, []);

  const reset = useCallback(() => {
    setToolCalls([]);
    setThinkingState("");
    pendingUpdatesRef.current = [];
    startTimesRef.current = {};
  }, []);

  return {
    toolCalls,
    thinking,
    isWorking,
    addToolCall,
    completeToolCall,
    setThinking,
    reset,
  };
}
