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
