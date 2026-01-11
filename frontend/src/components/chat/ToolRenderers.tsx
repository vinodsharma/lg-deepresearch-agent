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
  toolCallId: string | undefined;
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
  toolCallId: string | undefined,
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

  // Use useEffect to generate ID on first render to avoid impure Date.now() during render
  useEffect(() => {
    if (!generatedIdRef.current && !toolCallId) {
      generatedIdRef.current = generateToolCallId(toolName);
    }
  }, [toolCallId, toolName]);

  useEffect(() => {
    // Skip if we're still waiting for ID generation
    if (!toolCallId && !generatedIdRef.current) {
      return;
    }
    const effectId = toolCallId || generatedIdRef.current || `${toolName}-fallback`;
    const effectStartKey = `start-${effectId}`;
    if (!processedRef.current.has(effectStartKey)) {
      processedRef.current.add(effectStartKey);
      addToolCall({
        id: effectId,
        name: toolName,
        args: (args as Record<string, unknown>) || {},
      });
    }
  }, [toolCallId, toolName, args, addToolCall, processedRef]);

  useEffect(() => {
    // Skip if we're still waiting for ID generation
    if (!toolCallId && !generatedIdRef.current) {
      return;
    }
    const effectId = toolCallId || generatedIdRef.current || `${toolName}-fallback`;
    const effectCompleteKey = `complete-${effectId}`;
    if (status === "complete" && !processedRef.current.has(effectCompleteKey)) {
      processedRef.current.add(effectCompleteKey);
      completeToolCall(effectId, result);
    }
  }, [status, toolCallId, toolName, result, completeToolCall, processedRef]);
}

// Individual tool renderer components to properly use hooks
function TavilySearchRenderer({
  status,
  args,
  result,
  toolCallId,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync(toolCallId, "tavily_search", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function FetchUrlRenderer({
  status,
  args,
  result,
  toolCallId,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync(toolCallId, "fetch_url", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function AnalyzePdfRenderer({
  status,
  args,
  result,
  toolCallId,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync(toolCallId, "analyze_pdf", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function AnalyzeDocumentRenderer({
  status,
  args,
  result,
  toolCallId,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync(toolCallId, "analyze_document", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

function E2bExecuteRenderer({
  status,
  args,
  result,
  toolCallId,
  addToolCall,
  completeToolCall,
  processedRef,
}: ToolRendererProps) {
  useToolCallSync(toolCallId, "e2b_execute", status, args, result, addToolCall, completeToolCall, processedRef);
  return null;
}

// Props for think renderer component
interface ThinkRendererProps {
  status: string;
  args: unknown;
  toolCallId: string | undefined;
  setThinking: (thought: string) => void;
  processedRef: React.MutableRefObject<Set<string>>;
}

function ThinkRenderer({ status, args, toolCallId, setThinking, processedRef }: ThinkRendererProps) {
  const thinkKey = `think-${toolCallId || "unknown"}`;

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
    render: ({ status, args, result, toolCallId }) => (
      <TavilySearchRenderer
        status={status}
        args={args}
        result={result}
        toolCallId={toolCallId}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "fetch_url",
    render: ({ status, args, result, toolCallId }) => (
      <FetchUrlRenderer
        status={status}
        args={args}
        result={result}
        toolCallId={toolCallId}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "analyze_pdf",
    render: ({ status, args, result, toolCallId }) => (
      <AnalyzePdfRenderer
        status={status}
        args={args}
        result={result}
        toolCallId={toolCallId}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "analyze_document",
    render: ({ status, args, result, toolCallId }) => (
      <AnalyzeDocumentRenderer
        status={status}
        args={args}
        result={result}
        toolCallId={toolCallId}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  useRenderToolCall({
    name: "e2b_execute",
    render: ({ status, args, result, toolCallId }) => (
      <E2bExecuteRenderer
        status={status}
        args={args}
        result={result}
        toolCallId={toolCallId}
        addToolCall={addToolCall}
        completeToolCall={completeToolCall}
        processedRef={processedRef}
      />
    ),
  });

  // Handle think tool specially with deduplication
  useRenderToolCall({
    name: "think",
    render: ({ status, args, toolCallId }) => (
      <ThinkRenderer
        status={status}
        args={args}
        toolCallId={toolCallId}
        setThinking={setThinking}
        processedRef={processedRef}
      />
    ),
  });

  return null;
}
