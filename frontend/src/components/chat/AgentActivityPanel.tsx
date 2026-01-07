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
    setThinkingExpanded(isWorking);
    setToolsExpanded(isWorking);
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
