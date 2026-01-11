# Expandable Tool Log and Thinking Log Design

## Problem Statement

During large research tasks with parallel subagents, the UI exhibits several issues:

1. **Tool calls show only icons** - No details about what's being searched or fetched
2. **No expandable view** - Can't see full tool information (URL, query, results)
3. **Thinking mixed with output** - Agent's planning isn't separated from responses
4. **UI freezes** - Heavy parallel operations cause unresponsive UI

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tool grouping | Grouped accordion | Cleaner UI, less clutter during heavy ops |
| Tool details | Name, key arg, status, summary, duration | Balanced info without overwhelming |
| Thinking capture | Use `think` tool | Already exists, cleanest separation |
| Performance | Throttle updates (150ms) | Prevents freeze, stays responsive |

## Architecture

```
Backend (AG-UI events)
    │
    ▼
CopilotKit useRenderToolCall hooks
    │
    ▼
useToolCallAggregator hook (new)
    │
    ▼
AgentActivityPanel
    ├── ThinkingAccordion (captures "think" tool)
    └── ToolCallAccordion (groups all other tools)
```

### Data Flow

1. AG-UI backend emits tool call events via streaming
2. CopilotKit's `useRenderToolCall` hooks receive tool data
3. New `useToolCallAggregator` hook collects and batches tool calls
4. `think` tool content routes to `ThinkingAccordion`
5. All other tools route to `ToolCallAccordion`
6. `AgentActivityPanel` renders both accordions in `CustomAssistantMessage`

## Component Details

### Files to Modify

- `frontend/src/components/chat/ToolRenderers.tsx` - Route to aggregator
- `frontend/src/components/chat/CustomAssistantMessage.tsx` - Render AgentActivityPanel
- `frontend/src/components/chat/ToolCallItem.tsx` - Enhanced display with key argument

### New Files

- `frontend/src/hooks/useToolCallAggregator.ts` - Aggregation and throttling logic

### useToolCallAggregator Hook

```typescript
interface UseToolCallAggregatorReturn {
  thinking: string;
  toolCalls: ToolCall[];
  isWorking: boolean;
  addToolCall: (call: ToolCallData) => void;
  updateToolCall: (id: string, update: Partial<ToolCall>) => void;
}
```

- Maintains state for all active tool calls
- Separates `think` tool content into `thinking` state
- Batches updates every 150ms to prevent UI freeze
- Tracks `isWorking` for auto-expand behavior

### Enhanced ToolCallItem Display

```
┌─────────────────────────────────────────┐
│ 🔍 Web Search                    ✓ 2.3s │
│ "LangGraph architecture 2025"           │
│ Found 8 results                         │
└─────────────────────────────────────────┘
```

- **Line 1:** Icon, name, status indicator, duration
- **Line 2:** Key argument (query/URL) displayed prominently
- **Line 3:** Result summary when complete

### Key Argument Extraction

| Tool | Key Argument Field |
|------|-------------------|
| `tavily_search` | `args.query` |
| `fetch_url` | `args.url` |
| `analyze_pdf` | `args.filename` or `args.url` |
| `e2b_execute` | First line of `args.code` |
| `think` | Route to ThinkingAccordion |

## Performance Optimization

### Throttling Strategy

```typescript
// Batch updates every 150ms
const pendingUpdates = useRef<ToolCall[]>([]);

useEffect(() => {
  const interval = setInterval(() => {
    if (pendingUpdates.current.length > 0) {
      setToolCalls(prev => mergeToolCalls(prev, pendingUpdates.current));
      pendingUpdates.current = [];
    }
  }, 150);
  return () => clearInterval(interval);
}, []);
```

### Why 150ms

- Human perception threshold ~100ms
- During 5-subagent research: reduces ~50 updates/sec to ~7 batched updates
- Fast enough to feel responsive, slow enough to prevent freeze

### Additional Optimizations

- `React.memo` on `ToolCallItem` to prevent re-renders
- `useDeferredValue` for tool calls list
- Auto-collapse when > 10 tools

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Tool call fails | Red status icon, error message in item |
| Stream disconnects | Mark in-progress as "interrupted" |
| Empty think content | Don't render ThinkingAccordion |
| No tools called | Don't render ToolCallAccordion |
| Long query/URL (>100 chars) | Truncate, full text in tooltip |

## Auto-Expand Behavior

- Auto-expand when `isWorking=true`
- Keep expanded if user manually toggled
- Auto-collapse 2s after completion

## Testing

- Unit tests for `useToolCallAggregator` hook
- Unit tests for key argument extraction
- Integration test: mock tool calls, verify accordion behavior
- Manual test: large research query, verify no UI freeze

## Success Criteria

1. Tool calls display with visible query/URL (not just icons)
2. Tools grouped in expandable accordion
3. Thinking appears in separate accordion
4. UI stays responsive during parallel 5+ subagent research
5. All existing tests pass
