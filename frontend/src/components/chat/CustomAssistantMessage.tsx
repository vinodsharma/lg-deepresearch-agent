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
