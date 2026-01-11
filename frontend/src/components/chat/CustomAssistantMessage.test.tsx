// frontend/src/components/chat/CustomAssistantMessage.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentActivityProvider } from "@/contexts";

import { CustomAssistantMessage } from "./CustomAssistantMessage";

// Mock the CopilotKit hooks
vi.mock("@copilotkit/react-ui", () => ({
  Markdown: ({ content }: { content: string }) => <div>{content}</div>,
  useChatContext: () => ({
    icons: { spinnerIcon: <span>Loading...</span> },
  }),
}));

describe("CustomAssistantMessage", () => {
  const defaultProps = {
    isGenerating: false,
    rawData: {},
  };

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<AgentActivityProvider>{ui}</AgentActivityProvider>);
  };

  it("renders message content", () => {
    renderWithProvider(
      <CustomAssistantMessage
        {...defaultProps}
        message={{ id: "1", role: "assistant", content: "Hello world" }}
        isLoading={false}
      />
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    renderWithProvider(
      <CustomAssistantMessage
        {...defaultProps}
        message={{ id: "2", role: "assistant", content: "" }}
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders AgentActivityPanel", () => {
    renderWithProvider(
      <CustomAssistantMessage
        {...defaultProps}
        message={{ id: "3", role: "assistant", content: "Hello" }}
        isLoading={false}
      />
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
