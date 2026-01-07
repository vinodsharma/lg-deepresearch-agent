// frontend/src/hooks/useAgentActivity.ts
import { useCallback, useState } from "react";

import { ToolCall, ToolCallStatus } from "@/components/chat";

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  tavily_search: "Web Search",
  fetch_url: "Fetch Page",
  analyze_pdf: "Analyze PDF",
  analyze_document: "Analyze Doc",
  e2b_execute: "Run Code",
  think_tool: "Thinking",
};

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
  const [startTimes, setStartTimes] = useState<Record<string, number>>({});

  const isWorking = toolCalls.some((tc) => tc.status === "executing");

  const addToolCall = useCallback((params: AddToolCallParams) => {
    const { id, name, args } = params;

    setStartTimes((prev) => ({ ...prev, [id]: Date.now() }));

    setToolCalls((prev) => [
      ...prev,
      {
        id,
        name,
        displayName: TOOL_DISPLAY_NAMES[name] || name,
        status: "executing" as ToolCallStatus,
        args,
      },
    ]);
  }, []);

  const completeToolCall = useCallback(
    (id: string, result: unknown, error?: string) => {
      setToolCalls((prev) =>
        prev.map((tc) => {
          if (tc.id !== id) return tc;

          const startTime = startTimes[id];
          const durationMs = startTime ? Date.now() - startTime : undefined;

          return {
            ...tc,
            status: error ? "error" : "complete",
            result,
            resultSummary: error ? undefined : getResultSummary(tc.name, result),
            error,
            durationMs,
          };
        })
      );
    },
    [startTimes]
  );

  const setThinking = useCallback((content: string) => {
    setThinkingState((prev) => (prev ? prev + "\n\n" + content : content));
  }, []);

  const reset = useCallback(() => {
    setToolCalls([]);
    setThinkingState("");
    setStartTimes({});
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
