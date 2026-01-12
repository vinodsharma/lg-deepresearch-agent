# Expandable Tool & Thinking Log Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add expandable accordion panels to CopilotKit chat showing tool calls and agent thinking in real-time.

**Architecture:** Custom `AssistantMessage` component wraps tool call renderers registered via `useRenderToolCall`. Tool state accumulates in `useAgentActivity` hook, renders in accordion components above message content.

**Tech Stack:** React 19, CopilotKit 1.50.1, Tailwind CSS, Lucide icons, Vitest

---

## Task 1: Create ToolCallItem Component

**Files:**
- Create: `frontend/src/components/chat/ToolCallItem.tsx`
- Create: `frontend/src/components/chat/ToolCallItem.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/chat/ToolCallItem.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- ToolCallItem.test.tsx`
Expected: FAIL - Cannot find module './ToolCallItem'

**Step 3: Write minimal implementation**

```tsx
// frontend/src/components/chat/ToolCallItem.tsx
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { ReactNode } from "react";

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
}

export function ToolCallItem({
  name,
  status,
  args,
  resultSummary,
  error,
  durationMs,
  icon,
}: ToolCallItemProps) {
  const argsSummary = Object.entries(args)
    .slice(0, 2)
    .map(([key, value]) => {
      const strValue = typeof value === "string" ? value : JSON.stringify(value);
      const truncated = strValue.length > 40 ? strValue.slice(0, 40) + "..." : strValue;
      return `${key}: ${truncated}`;
    })
    .join(", ");

  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-slate-700/30 last:border-b-0">
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-slate-200 text-sm">{name}</span>
          <div className="flex items-center gap-2 text-xs">
            {status === "executing" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span className="text-slate-500">Running...</span>
              </>
            )}
            {status === "complete" && (
              <>
                <Check className="w-3 h-3 text-green-400" />
                {durationMs !== undefined && (
                  <span className="text-slate-500">{(durationMs / 1000).toFixed(1)}s</span>
                )}
              </>
            )}
            {status === "error" && (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>

        {argsSummary && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{argsSummary}</p>
        )}

        {status === "complete" && resultSummary && (
          <p className="text-xs text-slate-500 mt-0.5">{resultSummary}</p>
        )}

        {status === "error" && error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- ToolCallItem.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/ToolCallItem.tsx frontend/src/components/chat/ToolCallItem.test.tsx
git commit -m "feat(ui): add ToolCallItem component for displaying tool executions"
```

---

## Task 2: Create Accordion Component

**Files:**
- Create: `frontend/src/components/chat/Accordion.tsx`
- Create: `frontend/src/components/chat/Accordion.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/chat/Accordion.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Accordion } from "./Accordion";

describe("Accordion", () => {
  it("renders header and hides content when collapsed", () => {
    render(
      <Accordion header="Test Header" defaultExpanded={false}>
        <div>Hidden content</div>
      </Accordion>
    );

    expect(screen.getByText("Test Header")).toBeInTheDocument();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("shows content when expanded", () => {
    render(
      <Accordion header="Test Header" defaultExpanded={true}>
        <div>Visible content</div>
      </Accordion>
    );

    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();

    render(
      <Accordion header="Test Header" defaultExpanded={false}>
        <div>Toggle content</div>
      </Accordion>
    );

    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();

    await user.click(screen.getByText("Test Header"));

    expect(screen.getByText("Toggle content")).toBeInTheDocument();
  });

  it("respects controlled expanded prop", () => {
    const { rerender } = render(
      <Accordion header="Test Header" expanded={false}>
        <div>Controlled content</div>
      </Accordion>
    );

    expect(screen.queryByText("Controlled content")).not.toBeInTheDocument();

    rerender(
      <Accordion header="Test Header" expanded={true}>
        <div>Controlled content</div>
      </Accordion>
    );

    expect(screen.getByText("Controlled content")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- Accordion.test.tsx`
Expected: FAIL - Cannot find module './Accordion'

**Step 3: Write minimal implementation**

```tsx
// frontend/src/components/chat/Accordion.tsx
import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";

export interface AccordionProps {
  header: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  icon?: ReactNode;
}

export function Accordion({
  header,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  icon,
}: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newValue = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(newValue);
    }
    onToggle?.(newValue);
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
      >
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="flex-1 text-sm font-medium text-slate-300">{header}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- Accordion.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/Accordion.tsx frontend/src/components/chat/Accordion.test.tsx
git commit -m "feat(ui): add reusable Accordion component"
```

---

## Task 3: Create ThinkingAccordion Component

**Files:**
- Create: `frontend/src/components/chat/ThinkingAccordion.tsx`
- Create: `frontend/src/components/chat/ThinkingAccordion.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/chat/ThinkingAccordion.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThinkingAccordion } from "./ThinkingAccordion";

describe("ThinkingAccordion", () => {
  it("renders nothing when content is empty", () => {
    const { container } = render(<ThinkingAccordion content="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders thinking content", () => {
    render(
      <ThinkingAccordion
        content="I need to search for information about quantum computing."
        expanded={true}
      />
    );

    expect(screen.getByText("Agent Thinking")).toBeInTheDocument();
    expect(screen.getByText(/quantum computing/)).toBeInTheDocument();
  });

  it("shows header with brain icon", () => {
    render(
      <ThinkingAccordion
        content="Some thinking content"
        expanded={true}
      />
    );

    expect(screen.getByText("Agent Thinking")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- ThinkingAccordion.test.tsx`
Expected: FAIL - Cannot find module './ThinkingAccordion'

**Step 3: Write minimal implementation**

```tsx
// frontend/src/components/chat/ThinkingAccordion.tsx
import { Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Accordion } from "./Accordion";

export interface ThinkingAccordionProps {
  content: string;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export function ThinkingAccordion({
  content,
  expanded,
  onToggle,
}: ThinkingAccordionProps) {
  if (!content) {
    return null;
  }

  return (
    <Accordion
      header="Agent Thinking"
      icon={<Brain className="w-4 h-4" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="px-3 py-2 text-sm text-slate-300 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Accordion>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- ThinkingAccordion.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/ThinkingAccordion.tsx frontend/src/components/chat/ThinkingAccordion.test.tsx
git commit -m "feat(ui): add ThinkingAccordion for displaying agent reasoning"
```

---

## Task 4: Create ToolCallAccordion Component

**Files:**
- Create: `frontend/src/components/chat/ToolCallAccordion.tsx`
- Create: `frontend/src/components/chat/ToolCallAccordion.test.tsx`

**Step 1: Write the failing test**

```tsx
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
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- ToolCallAccordion.test.tsx`
Expected: FAIL - Cannot find module './ToolCallAccordion'

**Step 3: Write minimal implementation**

```tsx
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
            icon={TOOL_ICONS[tool.name] || <Wrench className="w-4 h-4" />}
          />
        ))}
      </div>
    </Accordion>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- ToolCallAccordion.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/ToolCallAccordion.tsx frontend/src/components/chat/ToolCallAccordion.test.tsx
git commit -m "feat(ui): add ToolCallAccordion for displaying tool execution list"
```

---

## Task 5: Create AgentActivityPanel Component

**Files:**
- Create: `frontend/src/components/chat/AgentActivityPanel.tsx`
- Create: `frontend/src/components/chat/AgentActivityPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
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
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- AgentActivityPanel.test.tsx`
Expected: FAIL - Cannot find module './AgentActivityPanel'

**Step 3: Write minimal implementation**

```tsx
// frontend/src/components/chat/AgentActivityPanel.tsx
import { useEffect, useState } from "react";

import { ThinkingAccordion } from "./ThinkingAccordion";
import { ToolCall, ToolCallAccordion } from "./ToolCallAccordion";

export interface AgentActivityPanelProps {
  toolCalls: ToolCall[];
  thinking: string;
  isWorking: boolean;
}

export function AgentActivityPanel({
  toolCalls,
  thinking,
  isWorking,
}: AgentActivityPanelProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  // Auto-expand when working, auto-collapse when done
  useEffect(() => {
    if (isWorking) {
      setThinkingExpanded(true);
      setToolsExpanded(true);
    } else {
      setThinkingExpanded(false);
      setToolsExpanded(false);
    }
  }, [isWorking]);

  const hasActivity = toolCalls.length > 0 || thinking;

  if (!hasActivity) {
    return <div />;
  }

  return (
    <div className="flex flex-col gap-2 mb-3">
      <ThinkingAccordion
        content={thinking}
        expanded={thinkingExpanded}
        onToggle={setThinkingExpanded}
      />
      <ToolCallAccordion
        toolCalls={toolCalls}
        expanded={toolsExpanded}
        onToggle={setToolsExpanded}
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- AgentActivityPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/chat/AgentActivityPanel.tsx frontend/src/components/chat/AgentActivityPanel.test.tsx
git commit -m "feat(ui): add AgentActivityPanel container component"
```

---

## Task 6: Create Component Index

**Files:**
- Create: `frontend/src/components/chat/index.ts`

**Step 1: Create index file**

```tsx
// frontend/src/components/chat/index.ts
export { Accordion } from "./Accordion";
export type { AccordionProps } from "./Accordion";

export { AgentActivityPanel } from "./AgentActivityPanel";
export type { AgentActivityPanelProps } from "./AgentActivityPanel";

export { ThinkingAccordion } from "./ThinkingAccordion";
export type { ThinkingAccordionProps } from "./ThinkingAccordion";

export { ToolCallAccordion } from "./ToolCallAccordion";
export type { ToolCall, ToolCallAccordionProps } from "./ToolCallAccordion";

export { ToolCallItem } from "./ToolCallItem";
export type { ToolCallItemProps, ToolCallStatus } from "./ToolCallItem";
```

**Step 2: Commit**

```bash
git add frontend/src/components/chat/index.ts
git commit -m "feat(ui): add chat components barrel export"
```

---

## Task 7: Create useAgentActivity Hook

**Files:**
- Create: `frontend/src/hooks/useAgentActivity.ts`
- Create: `frontend/src/hooks/useAgentActivity.test.ts`

**Step 1: Write the failing test**

```tsx
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
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- useAgentActivity.test.ts`
Expected: FAIL - Cannot find module './useAgentActivity'

**Step 3: Write minimal implementation**

```tsx
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
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- useAgentActivity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/hooks/useAgentActivity.ts frontend/src/hooks/useAgentActivity.test.ts
git commit -m "feat(ui): add useAgentActivity hook for tracking tool state"
```

---

## Task 8: Create Hooks Index

**Files:**
- Create: `frontend/src/hooks/index.ts`

**Step 1: Create index file**

```tsx
// frontend/src/hooks/index.ts
export { useAgentActivity } from "./useAgentActivity";
export type { AddToolCallParams, UseAgentActivityReturn } from "./useAgentActivity";
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/index.ts
git commit -m "feat(ui): add hooks barrel export"
```

---

## Task 9: Create Custom AssistantMessage Component

**Files:**
- Create: `frontend/src/components/chat/CustomAssistantMessage.tsx`
- Create: `frontend/src/components/chat/CustomAssistantMessage.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/chat/CustomAssistantMessage.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CustomAssistantMessage } from "./CustomAssistantMessage";

// Mock the CopilotKit hooks
vi.mock("@copilotkit/react-ui", () => ({
  Markdown: ({ content }: { content: string }) => <div>{content}</div>,
  useChatContext: () => ({
    icons: { spinnerIcon: <span>Loading...</span> },
  }),
}));

describe("CustomAssistantMessage", () => {
  it("renders message content", () => {
    render(
      <CustomAssistantMessage
        message={{ content: "Hello world" }}
        isLoading={false}
      />
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <CustomAssistantMessage
        message={{ content: "" }}
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders subComponent (generative UI)", () => {
    render(
      <CustomAssistantMessage
        message={{ content: "Response" }}
        isLoading={false}
        subComponent={<div>Tool UI</div>}
      />
    );

    expect(screen.getByText("Tool UI")).toBeInTheDocument();
    expect(screen.getByText("Response")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- CustomAssistantMessage.test.tsx`
Expected: FAIL - Cannot find module './CustomAssistantMessage'

**Step 3: Write minimal implementation**

```tsx
// frontend/src/components/chat/CustomAssistantMessage.tsx
import { AssistantMessageProps, Markdown, useChatContext } from "@copilotkit/react-ui";

export function CustomAssistantMessage(props: AssistantMessageProps) {
  const { icons } = useChatContext();
  const { message, isLoading, subComponent } = props;

  return (
    <div className="py-2">
      {/* Tool calls / Generative UI appears above the response */}
      {subComponent && <div className="mb-3">{subComponent}</div>}

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

Run: `cd frontend && npm run test -- CustomAssistantMessage.test.tsx`
Expected: PASS

**Step 5: Update index and commit**

```tsx
// Add to frontend/src/components/chat/index.ts
export { CustomAssistantMessage } from "./CustomAssistantMessage";
```

```bash
git add frontend/src/components/chat/CustomAssistantMessage.tsx frontend/src/components/chat/CustomAssistantMessage.test.tsx frontend/src/components/chat/index.ts
git commit -m "feat(ui): add CustomAssistantMessage with subComponent support"
```

---

## Task 10: Create ToolRenderers Component

**Files:**
- Create: `frontend/src/components/chat/ToolRenderers.tsx`

**Step 1: Write implementation**

```tsx
// frontend/src/components/chat/ToolRenderers.tsx
"use client";

import { useRenderToolCall } from "@copilotkit/react-core";
import { Code, FileText, Globe, Search } from "lucide-react";

import { ToolCallItem } from "./ToolCallItem";

function mapStatus(status: string): "executing" | "complete" | "error" {
  if (status === "executing" || status === "inProgress") return "executing";
  if (status === "complete") return "complete";
  return "error";
}

function getResultSummary(toolName: string, result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;

  const res = result as Record<string, unknown>;

  switch (toolName) {
    case "tavily_search": {
      const results = res.results;
      if (Array.isArray(results)) return `Found ${results.length} results`;
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
      if (typeof pages === "number") return `Analyzed ${pages} pages`;
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

export function ToolRenderers() {
  useRenderToolCall({
    name: "tavily_search",
    render: ({ status, args, result }) => (
      <ToolCallItem
        name="Web Search"
        status={mapStatus(status)}
        args={args as Record<string, unknown>}
        result={result}
        resultSummary={status === "complete" ? getResultSummary("tavily_search", result) : undefined}
        icon={<Search className="w-4 h-4" />}
      />
    ),
  });

  useRenderToolCall({
    name: "fetch_url",
    render: ({ status, args, result }) => (
      <ToolCallItem
        name="Fetch Page"
        status={mapStatus(status)}
        args={args as Record<string, unknown>}
        result={result}
        resultSummary={status === "complete" ? getResultSummary("fetch_url", result) : undefined}
        icon={<Globe className="w-4 h-4" />}
      />
    ),
  });

  useRenderToolCall({
    name: "analyze_pdf",
    render: ({ status, args, result }) => (
      <ToolCallItem
        name="Analyze PDF"
        status={mapStatus(status)}
        args={args as Record<string, unknown>}
        result={result}
        resultSummary={status === "complete" ? getResultSummary("analyze_pdf", result) : undefined}
        icon={<FileText className="w-4 h-4" />}
      />
    ),
  });

  useRenderToolCall({
    name: "analyze_document",
    render: ({ status, args, result }) => (
      <ToolCallItem
        name="Analyze Doc"
        status={mapStatus(status)}
        args={args as Record<string, unknown>}
        result={result}
        resultSummary={status === "complete" ? getResultSummary("analyze_document", result) : undefined}
        icon={<FileText className="w-4 h-4" />}
      />
    ),
  });

  useRenderToolCall({
    name: "e2b_execute",
    render: ({ status, args, result }) => (
      <ToolCallItem
        name="Run Code"
        status={mapStatus(status)}
        args={args as Record<string, unknown>}
        result={result}
        resultSummary={status === "complete" ? getResultSummary("e2b_execute", result) : undefined}
        icon={<Code className="w-4 h-4" />}
      />
    ),
  });

  // This component just registers the hooks, doesn't render anything
  return null;
}
```

**Step 2: Update index and commit**

```tsx
// Add to frontend/src/components/chat/index.ts
export { ToolRenderers } from "./ToolRenderers";
```

```bash
git add frontend/src/components/chat/ToolRenderers.tsx frontend/src/components/chat/index.ts
git commit -m "feat(ui): add ToolRenderers with useRenderToolCall hooks"
```

---

## Task 11: Update SidebarWrapper with Custom Components

**Files:**
- Modify: `frontend/src/components/layout/sidebar-wrapper.tsx`

**Step 1: Update implementation**

```tsx
// frontend/src/components/layout/sidebar-wrapper.tsx
"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { ReactNode } from "react";

import { CustomAssistantMessage, ToolRenderers } from "@/components/chat";
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
    <>
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
    </>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/layout/sidebar-wrapper.tsx
git commit -m "feat(ui): integrate custom AssistantMessage and ToolRenderers"
```

---

## Task 12: Run All Tests

**Step 1: Run complete test suite**

Run: `cd frontend && npm run test`
Expected: All tests PASS

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: address lint/test issues" --allow-empty
```

---

## Task 13: Manual Testing

**Step 1: Start development environment**

Run: `docker compose up --build`

**Step 2: Test in browser**

1. Open http://localhost:3001
2. Login with API key: `cmk1hf1pf0001gmjefnenjdum`
3. Open the sidebar (click chat icon)
4. Send a query: "Research quantum computing breakthroughs in 2025"
5. Verify:
   - Tool calls appear in accordion while executing
   - Accordion expands automatically while working
   - Tool items show spinner → checkmark transition
   - Accordion collapses when response completes
   - User can manually expand/collapse

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(ui): complete expandable tool and thinking log implementation"
```
