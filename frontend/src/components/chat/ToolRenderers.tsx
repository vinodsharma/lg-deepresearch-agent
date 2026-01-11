// frontend/src/components/chat/ToolRenderers.tsx
"use client";

import { useRenderToolCall } from "@copilotkit/react-core";
import { useEffect, useRef } from "react";

import { useAgentActivityContext } from "@/contexts";

// Props for tool renderer components
interface ToolRendererProps {
  status: string;
  args: unknown;
  result: unknown;
  addToolCall: (params: { id: string; name: string; args: Record<string, unknown> }) => void;
  completeToolCall: (id: string, result: unknown, error?: string) => void;
  processedRef: React.MutableRefObject<Set<string>>;
}

// Generate stable ID using a counter instead of Date.now()
let toolCallCounter = 0;
function generateToolCallId(toolName: string): string {
  toolCallCounter += 1;
  return `${toolName}-${toolCallCounter}`;
}

// Helper hook to sync tool call state
function useToolCallSync(
  toolName: string,
  status: string,
  args: unknown,
  result: unknown,
  addToolCall: (params: { id: string; name: string; args: Record<string, unknown> }) => void,
  completeToolCall: (id: string, result: unknown, error?: string) => void,
  processedRef: React.MutableRefObject<Set<string>>
) {
  // Generate ID only once using a ref with lazy initialization
  const generatedIdRef = useRef<string | null>(null);

  // Generate ID on first render
  if (!generatedIdRef.current) {
    generatedIdRef.current = generateToolCallId(toolName);
  }

  const id = generatedIdRef.current;

  useEffect(() => {
    const startKey = `start-${id}`;
    if (!processedRef.current.has(startKey)) {
      processedRef.current.add(startKey);
      addToolCall({
        id,
        name: toolName,
        args: (args as Record<string, unknown>) || {},
      });
    }
  }, [id, toolName, args, addToolCall, processedRef]);

  useEffect(() => {
    const completeKey = `complete-${id}`;
    if (status === "complete" && !processedRef.current.has(completeKey)) {
      processedRef.current.add(completeKey);
      completeToolCall(id, result);
    }
  }, [status, id, result, completeToolCall, processedRef]);
}

// Individual tool renderer components to properly use hooks
function TavilySearchRenderer({
  status,
  args,
  result,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync("tavily_search", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function FetchUrlRenderer({
  status,
  args,
  result,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync("fetch_url", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function AnalyzePdfRenderer({
  status,
  args,
  result,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync("analyze_pdf", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function AnalyzeDocumentRenderer({
  status,
  args,
  result,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync("analyze_document", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function E2bExecuteRenderer({
  status,
  args,
  result,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync("e2b_execute", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

// Props for think renderer component
interface ThinkRendererProps {
  status: string;
  args: unknown;
  setThinking: (thought: string) => void;
  processedRef: React.MutableRefObject<Set<string>>;
}

let thinkCounter = 0;

function ThinkRenderer({ status, args, setThinking, processedRef }: ThinkRendererProps) {
  const thinkIdRef = useRef<string | null>(null);
  if (!thinkIdRef.current) {
    thinkCounter += 1;
    thinkIdRef.current = `think-${thinkCounter}`;
  }
  const thinkKey = thinkIdRef.current;

  useEffect(() => {
    if (status === "complete" && !processedRef.current.has(thinkKey)) {
      processedRef.current.add(thinkKey);
      if (args && typeof args === "object") {
        const thought = (args as Record<string, unknown>).thought;
        if (typeof thought === "string") {
          setThinking(thought);
        }
      }
    }
  }, [status, args, thinkKey, setThinking, processedRef]);

  return null;
}

export function ToolRenderers() {
  const { addToolCall, completeToolCall, setThinking } = useAgentActivityContext();
  const processedRef = useRef<Set<string>>(new Set());

  // Register tool renderers that feed data to context
  useRenderToolCall({
    name: "tavily_search",
    render: ({ status, args, result }) => (
      <TavilySearchRenderer
        status={status}
        args={args}
        result={result}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "fetch_url",
    render: ({ status, args, result }) => (
      <FetchUrlRenderer
        status={status}
        args={args}
        result={result}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "analyze_pdf",
    render: ({ status, args, result }) => (
      <AnalyzePdfRenderer
        status={status}
        args={args}
        result={result}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "analyze_document",
    render: ({ status, args, result }) => (
      <AnalyzeDocumentRenderer
        status={status}
        args={args}
        result={result}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "e2b_execute",
    render: ({ status, args, result }) => (
      <E2bExecuteRenderer
        status={status}
        args={args}
        result={result}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  // Handle think tool specially with deduplication
  useRenderToolCall({
    name: "think",
    render: ({ status, args }) => (
      <ThinkRenderer
        status={status}
        args={args}
        setThinking={setThinking}
        processedRef={processedRef}
      />
    ),
  });

  return null;
}
