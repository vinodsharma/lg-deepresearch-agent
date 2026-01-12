# Expandable Tool Log & Thinking Log Design

## Overview

Add expandable accordion panels to the CopilotKit chat UI showing agent tool calls and thinking process in real-time.

## Requirements

- Accordion-style expandable sections
- Separate sections for thinking and tools
- Appears above the assistant's text response
- Expanded while working, auto-collapse on complete
- Moderate detail level: tool name, input parameters, result summary, execution time
- Only show thinking when `think_tool` is called

## Component Structure

```
frontend/src/components/chat/
├── AgentActivityPanel.tsx    # Container for thinking + tools
├── ThinkingAccordion.tsx     # Expandable thinking section
├── ToolCallAccordion.tsx     # Expandable tool call section
└── ToolCallItem.tsx          # Individual tool call row
```

### AgentActivityPanel

Main wrapper component that:
- Receives tool calls and thinking data from CopilotKit message stream
- Manages expanded/collapsed state (expanded while `isLoading`, collapsed when complete)
- Renders ThinkingAccordion followed by ToolCallAccordion

### ThinkingAccordion

Displays agent reasoning:
- Header: "Agent Thinking" with expand/collapse chevron
- Body: Rendered markdown of think_tool content
- Only renders if think_tool was called

### ToolCallAccordion

Displays tool execution:
- Header: "Tools Used (N)" with expand/collapse chevron
- Body: List of ToolCallItem components

### ToolCallItem

Individual tool display:
- Icon based on tool type
- Tool name and brief input summary
- Status indicator (spinner while running, checkmark when done)
- Expandable details: parameters, result summary, execution time

## CopilotKit Integration

Use `useRenderToolCall` hook for each tool:

```tsx
useRenderToolCall({
  name: "tavily_search",
  render: ({ status, args, result }) => (
    <ToolCallItem
      icon={<Search />}
      name="Web Search"
      args={args}
      result={result}
      status={status}
    />
  ),
});
```

### Tool Mappings

| Backend Tool | Display Name | Icon |
|-------------|--------------|------|
| `tavily_search` | Web Search | Search |
| `fetch_url` | Fetch Page | Globe |
| `analyze_pdf` | Analyze PDF | FileText |
| `analyze_document` | Analyze Doc | FileText |
| `e2b_execute` | Run Code | Code |
| `think_tool` | (ThinkingAccordion) | Brain |

### State Flow

1. Tool call starts → `status: "executing"` → show spinner, expand accordion
2. Tool call ends → `status: "complete"` → show checkmark, keep expanded
3. Assistant message complete → auto-collapse both accordions

## Visual Design

```
┌─────────────────────────────────────────────────┐
│ 💭 Agent Thinking                          ▼   │
├─────────────────────────────────────────────────┤
│ I need to search for recent information about   │
│ quantum computing breakthroughs, then analyze   │
│ the most relevant sources...                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔧 Tools Used (3)                          ▼   │
├─────────────────────────────────────────────────┤
│ ✓ 🔍 Web Search                        1.2s    │
│      Query: "quantum computing 2025"            │
│      Found 5 results                            │
│ ─────────────────────────────────────────────── │
│ ✓ 🌐 Fetch Page                        0.8s    │
│      URL: nature.com/articles/...               │
│      Extracted 2,400 words                      │
│ ─────────────────────────────────────────────── │
│ ● 🔍 Web Search                        ...      │
│      Query: "fusion reactor progress"           │
│      Running...                                 │
└─────────────────────────────────────────────────┘
```

### Styling

- Background: `bg-slate-800/30` with `border-slate-700/50`
- Headers: `text-slate-300` with hover highlight
- Active tool: pulsing dot indicator
- Completed tool: green checkmark
- Execution time: `text-slate-500` right-aligned

## Data Flow

### Custom Hook: useAgentActivity

```tsx
const { toolCalls, thinking, isWorking } = useAgentActivity();
```

Subscribes to CopilotKit message events, accumulates tool calls and thinking content per assistant message, tracks loading state for auto-collapse.

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| No tools called | Hide ToolCallAccordion entirely |
| No think_tool called | Hide ThinkingAccordion entirely |
| Tool errors | Show red X icon, error message in result |
| Very long outputs | Truncate with "Show more" button |
| Multiple think_tool calls | Concatenate into single thinking section |
| Rapid tool calls | Batch UI updates, animate additions |

### Result Summaries

- `tavily_search`: "Found N results"
- `fetch_url`: "Extracted N words"
- `analyze_pdf/document`: "Analyzed N pages"
- `e2b_execute`: "Execution completed" or first line of output
