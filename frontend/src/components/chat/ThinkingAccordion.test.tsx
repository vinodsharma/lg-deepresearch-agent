// frontend/src/components/chat/ThinkingAccordion.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThinkingAccordion } from "./ThinkingAccordion";

describe("ThinkingAccordion", () => {
  it("renders nothing when content is empty", () => {
    const { container } = render(<ThinkingAccordion content="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders thinking content", () => {
    render(
      <ThinkingAccordion
        content="I need to search for information about quantum computing."
        expanded={true}
      />
    );

    expect(screen.getByText("Agent Thinking")).toBeInTheDocument();
    expect(screen.getByText(/quantum computing/)).toBeInTheDocument();
  });

  it("shows header with brain icon", () => {
    render(
      <ThinkingAccordion
        content="Some thinking content"
        expanded={true}
      />
    );

    expect(screen.getByText("Agent Thinking")).toBeInTheDocument();
  });
});
