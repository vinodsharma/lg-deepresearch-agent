// frontend/src/components/chat/Accordion.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Accordion } from "./Accordion";

describe("Accordion", () => {
  it("renders header and hides content when collapsed", () => {
    render(
      <Accordion header="Test Header" defaultExpanded={false}>
        <div>Hidden content</div>
      </Accordion>
    );

    expect(screen.getByText("Test Header")).toBeInTheDocument();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("shows content when expanded", () => {
    render(
      <Accordion header="Test Header" defaultExpanded={true}>
        <div>Visible content</div>
      </Accordion>
    );

    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();

    render(
      <Accordion header="Test Header" defaultExpanded={false}>
        <div>Toggle content</div>
      </Accordion>
    );

    expect(screen.queryByText("Toggle content")).not.toBeInTheDocument();

    await user.click(screen.getByText("Test Header"));

    expect(screen.getByText("Toggle content")).toBeInTheDocument();
  });

  it("respects controlled expanded prop", () => {
    const { rerender } = render(
      <Accordion header="Test Header" expanded={false}>
        <div>Controlled content</div>
      </Accordion>
    );

    expect(screen.queryByText("Controlled content")).not.toBeInTheDocument();

    rerender(
      <Accordion header="Test Header" expanded={true}>
        <div>Controlled content</div>
      </Accordion>
    );

    expect(screen.getByText("Controlled content")).toBeInTheDocument();
  });
});
