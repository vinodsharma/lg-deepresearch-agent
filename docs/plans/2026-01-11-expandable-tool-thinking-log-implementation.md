# Expandable Tool Log and Thinking Log Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire existing accordion components into CopilotKit chat with enhanced tool details and throttled updates.

**Architecture:** Create a React context to share agent activity state. Modify ToolRenderers to feed data to the context instead of rendering inline. CustomAssistantMessage renders AgentActivityPanel using context data.

**Tech Stack:** React, CopilotKit, TypeScript, Vitest

---

## Task 1: Enhance ToolCallItem with Key Argument Display

**Files:**
- Modify: `frontend/src/components/chat/ToolCallItem.tsx`
- Modify: `frontend/src/components/chat/ToolCallItem.test.tsx`

**Step 1: Write the failing test for key argument extraction**

Add to `frontend/src/components/chat/ToolCallItem.test.tsx`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run ToolCallItem.test.tsx`
Expected: FAIL with "Unable to find an element"

**Step 3: Implement key argument display**

Replace `frontend/src/components/chat/ToolCallItem.tsx`:

```typescript
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { memo, ReactNode } from "react";

export type ToolCallStatus = "executing" | "complete" | "error";

export interface ToolCallItemProps {
  name: string;
  status: ToolCallStatus;
  args: Record<string, unknown>;
  result?: unknown;
  resultSummary?: string;
  error?: string;
  durationMs?: number;
  icon?: ReactNode;
  keyArgument?: string;
}

function truncateKeyArg(value: string, maxLength: number = 100): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "...";
}

export const ToolCallItem = memo(function ToolCallItem({
  name,
  status,
  keyArgument,
  resultSummary,
  error,
  durationMs,
  icon,
}: ToolCallItemProps) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-slate-600/50 last:border-b-0">
      <div className="mt-0.5 text-white">{icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-white text-sm">{name}</span>
          <div className="flex items-center gap-2 text-xs">
            {status === "executing" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span className="text-white">Running...</span>
              </>
            )}
            {status === "complete" && (
              <>
                <Check className="w-3 h-3 text-green-500" />
                {durationMs !== undefined && (
                  <span className="text-white">
                    {(durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </>
            )}
            {status === "error" && (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>

        {keyArgument && (
          <p className="text-xs text-blue-300 mt-0.5 truncate" title={keyArgument}>
            "{truncateKeyArg(keyArgument)}"
          </p>
        )}

        {status === "complete" && resultSummary && (
          <p className="text-xs text-white/80 mt-0.5">{resultSummary}</p>
        )}

        {status === "error" && error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    </div>
  );
});
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run ToolCallItem.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/ToolCallItem.tsx frontend/src/components/chat/ToolCallItem.test.tsx
git commit -m "feat(ui): add key argument display to ToolCallItem with truncation"
```

---

## Task 2: Add Throttling to useAgentActivity Hook

**Files:**
- Modify: `frontend/src/hooks/useAgentActivity.ts`
- Modify: `frontend/src/hooks/useAgentActivity.test.ts`

**Step 1: Write the failing test for throttling**

Add to `frontend/src/hooks/useAgentActivity.test.ts`:

```typescript
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useAgentActivity } from "./useAgentActivity";

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

    // Before throttle interval, state should have pending updates
    expect(result.current.toolCalls.length).toBeLessThanOrEqual(5);

    // After throttle interval (150ms), all should be present
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.toolCalls.length).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run useAgentActivity.test.ts`
Expected: FAIL or existing tests may pass but new test behavior needs verification

**Step 3: Implement throttling**

Replace `frontend/src/hooks/useAgentActivity.ts`:

```typescript
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
  think: "Thinking",
};

const KEY_ARG_FIELDS: Record<string, string> = {
  tavily_search: "query",
  fetch_url: "url",
  analyze_pdf: "url",
  analyze_document: "url",
  e2b_execute: "code",
};

function getKeyArgument(toolName: string, args: Record<string, unknown>): string | undefined {
  const field = KEY_ARG_FIELDS[toolName];
  if (!field) return undefined;

  const value = args[field];
  if (typeof value !== "string") return undefined;

  // For code, take first line only
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

interface PendingUpdate {
  type: "add" | "complete";
  payload: AddToolCallParams | { id: string; result: unknown; error?: string };
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
  const startTimesRef = useRef<Record<string, number>>({});
  const pendingUpdatesRef = useRef<PendingUpdate[]>([]);

  const isWorking = toolCalls.some((tc) => tc.status === "executing");

  // Throttled batch processing
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingUpdatesRef.current.length === 0) return;

      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = [];

      setToolCalls((prev) => {
        let next = [...prev];

        for (const update of updates) {
          if (update.type === "add") {
            const params = update.payload as AddToolCallParams;
            const existing = next.find((tc) => tc.id === params.id);
            if (!existing) {
              next.push({
                id: params.id,
                name: params.name,
                displayName: TOOL_DISPLAY_NAMES[params.name] || params.name,
                status: "executing" as ToolCallStatus,
                args: params.args,
                keyArgument: getKeyArgument(params.name, params.args),
              });
            }
          } else if (update.type === "complete") {
            const { id, result, error } = update.payload as {
              id: string;
              result: unknown;
              error?: string;
            };
            next = next.map((tc) => {
              if (tc.id !== id) return tc;
              const startTime = startTimesRef.current[id];
              const durationMs = startTime ? Date.now() - startTime : undefined;
              return {
                ...tc,
                status: error ? "error" : "complete",
                result,
                resultSummary: error ? undefined : getResultSummary(tc.name, result),
                error,
                durationMs,
              };
            });
          }
        }

        return next;
      });
    }, THROTTLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const addToolCall = useCallback((params: AddToolCallParams) => {
    startTimesRef.current[params.id] = Date.now();
    pendingUpdatesRef.current.push({ type: "add", payload: params });
  }, []);

  const completeToolCall = useCallback(
    (id: string, result: unknown, error?: string) => {
      pendingUpdatesRef.current.push({
        type: "complete",
        payload: { id, result, error },
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
    startTimesRef.current = {};
    pendingUpdatesRef.current = [];
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
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run useAgentActivity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/hooks/useAgentActivity.ts frontend/src/hooks/useAgentActivity.test.ts
git commit -m "feat(ui): add throttling to useAgentActivity hook (150ms batching)"
```

---

## Task 3: Create AgentActivityContext

**Files:**
- Create: `frontend/src/contexts/AgentActivityContext.tsx`
- Create: `frontend/src/contexts/AgentActivityContext.test.tsx`
- Create: `frontend/src/contexts/index.ts`

**Step 1: Write the failing test**

Create `frontend/src/contexts/AgentActivityContext.test.tsx`:

```typescript
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run AgentActivityContext.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Implement the context**

Create `frontend/src/contexts/AgentActivityContext.tsx`:

```typescript
"use client";

import { createContext, ReactNode, useContext } from "react";

import { useAgentActivity, UseAgentActivityReturn } from "@/hooks";

const AgentActivityContext = createContext<UseAgentActivityReturn | null>(null);

export function AgentActivityProvider({ children }: { children: ReactNode }) {
  const agentActivity = useAgentActivity();

  return (
    <AgentActivityContext.Provider value={agentActivity}>
      {children}
    </AgentActivityContext.Provider>
  );
}

export function useAgentActivityContext(): UseAgentActivityReturn {
  const context = useContext(AgentActivityContext);
  if (!context) {
    throw new Error(
      "useAgentActivityContext must be used within AgentActivityProvider"
    );
  }
  return context;
}
```

Create `frontend/src/contexts/index.ts`:

```typescript
export { AgentActivityProvider, useAgentActivityContext } from "./AgentActivityContext";
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run AgentActivityContext.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/contexts/
git commit -m "feat(ui): add AgentActivityContext for shared tool/thinking state"
```

---

## Task 4: Update ToolCallAccordion to Use keyArgument

**Files:**
- Modify: `frontend/src/components/chat/ToolCallAccordion.tsx`
- Modify: `frontend/src/components/chat/ToolCallAccordion.test.tsx`

**Step 1: Write the failing test**

Add to `frontend/src/components/chat/ToolCallAccordion.test.tsx`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run ToolCallAccordion.test.tsx`
Expected: FAIL

**Step 3: Update ToolCall interface and component**

Modify `frontend/src/components/chat/ToolCallAccordion.tsx`:

```typescript
// frontend/src/components/chat/ToolCallAccordion.tsx
import {
  Code,
  FileText,
  Globe,
  Search,
  Wrench,
} from "lucide-react";
import { ReactNode } from "react";

import { Accordion } from "./Accordion";
import { ToolCallItem, ToolCallStatus } from "./ToolCallItem";

export interface ToolCall {
  id: string;
  name: string;
  displayName: string;
  status: ToolCallStatus;
  args: Record<string, unknown>;
  result?: unknown;
  resultSummary?: string;
  error?: string;
  durationMs?: number;
  keyArgument?: string;
}

export interface ToolCallAccordionProps {
  toolCalls: ToolCall[];
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

const TOOL_ICONS: Record<string, ReactNode> = {
  tavily_search: <Search className="w-4 h-4" />,
  fetch_url: <Globe className="w-4 h-4" />,
  analyze_pdf: <FileText className="w-4 h-4" />,
  analyze_document: <FileText className="w-4 h-4" />,
  e2b_execute: <Code className="w-4 h-4" />,
};

export function ToolCallAccordion({
  toolCalls,
  expanded,
  onToggle,
}: ToolCallAccordionProps) {
  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <Accordion
      header={`Tools Used (${toolCalls.length})`}
      icon={<Wrench className="w-4 h-4" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div>
        {toolCalls.map((tool) => (
          <ToolCallItem
            key={tool.id}
            name={tool.displayName}
            status={tool.status}
            args={tool.args}
            result={tool.result}
            resultSummary={tool.resultSummary}
            error={tool.error}
            durationMs={tool.durationMs}
            keyArgument={tool.keyArgument}
            icon={TOOL_ICONS[tool.name] || <Wrench className="w-4 h-4" />}
          />
        ))}
      </div>
    </Accordion>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run ToolCallAccordion.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/ToolCallAccordion.tsx frontend/src/components/chat/ToolCallAccordion.test.tsx
git commit -m "feat(ui): add keyArgument support to ToolCallAccordion"
```

---

## Task 5: Modify ToolRenderers to Feed Context

**Files:**
- Modify: `frontend/src/components/chat/ToolRenderers.tsx`

**Step 1: Update ToolRenderers to use context**

Replace `frontend/src/components/chat/ToolRenderers.tsx`:

```typescript
// frontend/src/components/chat/ToolRenderers.tsx
"use client";

import { useRenderToolCall } from "@copilotkit/react-core";
import { useEffect, useRef } from "react";

import { useAgentActivityContext } from "@/contexts";

export function ToolRenderers() {
  const { addToolCall, completeToolCall, setThinking } = useAgentActivityContext();
  const processedRef = useRef<Set<string>>(new Set());

  // Register tool renderers that feed data to context
  useRenderToolCall({
    name: "tavily_search",
    render: ({ status, args, result, toolCallId }) => {
      useToolCallSync(toolCallId, "tavily_search", status, args, result, addToolCall, completeToolCall, processedRef);
      return null; // Don't render inline - AgentActivityPanel handles display
    },
  });

  useRenderToolCall({
    name: "fetch_url",
    render: ({ status, args, result, toolCallId }) => {
      useToolCallSync(toolCallId, "fetch_url", status, args, result, addToolCall, completeToolCall, processedRef);
      return null;
    },
  });

  useRenderToolCall({
    name: "analyze_pdf",
    render: ({ status, args, result, toolCallId }) => {
      useToolCallSync(toolCallId, "analyze_pdf", status, args, result, addToolCall, completeToolCall, processedRef);
      return null;
    },
  });

  useRenderToolCall({
    name: "analyze_document",
    render: ({ status, args, result, toolCallId }) => {
      useToolCallSync(toolCallId, "analyze_document", status, args, result, addToolCall, completeToolCall, processedRef);
      return null;
    },
  });

  useRenderToolCall({
    name: "e2b_execute",
    render: ({ status, args, result, toolCallId }) => {
      useToolCallSync(toolCallId, "e2b_execute", status, args, result, addToolCall, completeToolCall, processedRef);
      return null;
    },
  });

  // Handle think tool specially - route to thinking accordion
  useRenderToolCall({
    name: "think",
    render: ({ status, args }) => {
      if (status === "complete" && args && typeof args === "object") {
        const thought = (args as Record<string, unknown>).thought;
        if (typeof thought === "string") {
          setThinking(thought);
        }
      }
      return null;
    },
  });

  return null;
}

// Helper hook to sync tool call state
function useToolCallSync(
  toolCallId: string | undefined,
  toolName: string,
  status: string,
  args: unknown,
  result: unknown,
  addToolCall: (params: { id: string; name: string; args: Record<string, unknown> }) => void,
  completeToolCall: (id: string, result: unknown, error?: string) => void,
  processedRef: React.MutableRefObject<Set<string>>
) {
  const id = toolCallId || `${toolName}-${Date.now()}`;
  const startKey = `start-${id}`;
  const completeKey = `complete-${id}`;

  useEffect(() => {
    if (!processedRef.current.has(startKey)) {
      processedRef.current.add(startKey);
      addToolCall({
        id,
        name: toolName,
        args: (args as Record<string, unknown>) || {},
      });
    }
  }, [id, toolName, args, addToolCall, startKey, processedRef]);

  useEffect(() => {
    if (status === "complete" && !processedRef.current.has(completeKey)) {
      processedRef.current.add(completeKey);
      completeToolCall(id, result);
    }
  }, [status, id, result, completeToolCall, completeKey, processedRef]);
}
```

**Step 2: Run existing tests to verify no regression**

Run: `cd frontend && npm test -- --run`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/components/chat/ToolRenderers.tsx
git commit -m "feat(ui): modify ToolRenderers to feed AgentActivityContext"
```

---

## Task 6: Update CustomAssistantMessage to Render AgentActivityPanel

**Files:**
- Modify: `frontend/src/components/chat/CustomAssistantMessage.tsx`
- Modify: `frontend/src/components/chat/CustomAssistantMessage.test.tsx`

**Step 1: Write the failing test**

Update `frontend/src/components/chat/CustomAssistantMessage.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentActivityProvider } from "@/contexts";

import { CustomAssistantMessage } from "./CustomAssistantMessage";

// Mock CopilotKit
vi.mock("@copilotkit/react-ui", () => ({
  Markdown: ({ content }: { content: string }) => <div>{content}</div>,
  useChatContext: () => ({
    icons: { spinnerIcon: <span>Loading...</span> },
  }),
}));

describe("CustomAssistantMessage", () => {
  it("renders AgentActivityPanel", () => {
    render(
      <AgentActivityProvider>
        <CustomAssistantMessage
          message={{ content: "Hello" }}
          isLoading={false}
          subComponent={null}
        />
      </AgentActivityProvider>
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify setup**

Run: `cd frontend && npm test -- --run CustomAssistantMessage.test.tsx`

**Step 3: Update CustomAssistantMessage**

Replace `frontend/src/components/chat/CustomAssistantMessage.tsx`:

```typescript
// frontend/src/components/chat/CustomAssistantMessage.tsx
import { AssistantMessageProps, Markdown, useChatContext } from "@copilotkit/react-ui";

import { useAgentActivityContext } from "@/contexts";

import { AgentActivityPanel } from "./AgentActivityPanel";

export function CustomAssistantMessage(props: AssistantMessageProps) {
  const { icons } = useChatContext();
  const { message, isLoading } = props;
  const { toolCalls, thinking, isWorking } = useAgentActivityContext();

  return (
    <div className="py-2">
      {/* Agent activity panel with accordions */}
      <AgentActivityPanel
        toolCalls={toolCalls}
        thinking={thinking}
        isWorking={isWorking || isLoading}
      />

      {/* Message content */}
      {(message?.content || isLoading) && (
        <div className="text-slate-200">
          {message?.content && <Markdown content={message.content} />}
          {isLoading && !message?.content && (
            <div className="flex items-center gap-2 text-slate-400">
              {icons.spinnerIcon}
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run CustomAssistantMessage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/CustomAssistantMessage.tsx frontend/src/components/chat/CustomAssistantMessage.test.tsx
git commit -m "feat(ui): integrate AgentActivityPanel into CustomAssistantMessage"
```

---

## Task 7: Wrap CopilotSidebar with AgentActivityProvider

**Files:**
- Modify: `frontend/src/components/layout/sidebar-wrapper.tsx`

**Step 1: Update sidebar-wrapper**

Replace `frontend/src/components/layout/sidebar-wrapper.tsx`:

```typescript
"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { ReactNode } from "react";

import { CustomAssistantMessage, ToolRenderers } from "@/components/chat";
import { AgentActivityProvider } from "@/contexts";
import { useAuthStore } from "@/lib/store/auth-store";

interface SidebarWrapperProps {
  children: ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const { apiKey } = useAuthStore();

  // Don't show sidebar if not authenticated
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <AgentActivityProvider>
      <ToolRenderers />
      <CopilotSidebar
        defaultOpen={false}
        clickOutsideToClose={true}
        labels={{
          title: "Research Assistant",
          initial: "What would you like to research today?",
          placeholder: "Ask me to research any topic...",
        }}
        AssistantMessage={CustomAssistantMessage}
      >
        {children}
      </CopilotSidebar>
    </AgentActivityProvider>
  );
}
```

**Step 2: Run all tests**

Run: `cd frontend && npm test -- --run`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/components/layout/sidebar-wrapper.tsx
git commit -m "feat(ui): wrap CopilotSidebar with AgentActivityProvider"
```

---

## Task 8: Run Full Test Suite and Manual Verification

**Step 1: Run all frontend tests**

Run: `cd frontend && npm test -- --run`
Expected: All tests PASS

**Step 2: Build frontend**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Manual verification**

1. Start the application: `docker compose up -d`
2. Open http://localhost:3001
3. Login and create a new session
4. Run a complex research query: "Compare LangGraph and Google ADK for building AI agents"
5. Verify:
   - Tools appear in grouped accordion ("Tools Used (N)")
   - Each tool shows key argument (query/URL) prominently
   - Thinking appears in separate accordion (if think tool is used)
   - UI stays responsive during parallel operations

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(ui): complete expandable tool and thinking log implementation"
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | ToolCallItem.tsx | Add key argument display with truncation |
| 2 | useAgentActivity.ts | Add 150ms throttling for batched updates |
| 3 | AgentActivityContext.tsx | Create context for shared state |
| 4 | ToolCallAccordion.tsx | Pass keyArgument to ToolCallItem |
| 5 | ToolRenderers.tsx | Feed data to context, handle think tool |
| 6 | CustomAssistantMessage.tsx | Render AgentActivityPanel |
| 7 | sidebar-wrapper.tsx | Wrap with AgentActivityProvider |
| 8 | - | Full test suite and manual verification |
