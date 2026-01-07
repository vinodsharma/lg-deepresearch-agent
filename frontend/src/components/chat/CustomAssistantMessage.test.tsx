// frontend/src/components/chat/CustomAssistantMessage.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("renders message content", () => {
    render(
      <CustomAssistantMessage
        {...defaultProps}
        message={{ id: "1", role: "assistant", content: "Hello world" }}
        isLoading={false}
      />
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <CustomAssistantMessage
        {...defaultProps}
        message={{ id: "2", role: "assistant", content: "" }}
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders subComponent (generative UI)", () => {
    render(
      <CustomAssistantMessage
        {...defaultProps}
        message={{ id: "3", role: "assistant", content: "Response" }}
        isLoading={false}
        subComponent={<div>Tool UI</div>}
      />
    );

    expect(screen.getByText("Tool UI")).toBeInTheDocument();
    expect(screen.getByText("Response")).toBeInTheDocument();
  });
});
