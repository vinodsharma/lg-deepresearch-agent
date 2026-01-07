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
