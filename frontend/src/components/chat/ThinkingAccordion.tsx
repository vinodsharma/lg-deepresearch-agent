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
