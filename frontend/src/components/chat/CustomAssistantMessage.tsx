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
