import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

function renderDialog(overrides = {}) {
  const onOpenChange = vi.fn();

  render(
    <Dialog
      actions={<button type="button">Save</button>}
      description="Confirm the workspace action."
      onOpenChange={onOpenChange}
      open
      title="Confirm action"
      {...overrides}
    >
      <button type="button">Focusable content</button>
    </Dialog>,
  );

  return { onOpenChange };
}

describe("Dialog", () => {
  it("renders an accessible dialog with title, description, content, and actions", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Confirm action" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Confirm the workspace action.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Focusable content" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Dialog onOpenChange={vi.fn()} open={false} title="Hidden dialog">
        Hidden content
      </Dialog>,
    );

    expect(screen.queryByRole("dialog", { name: "Hidden dialog" })).not.toBeInTheDocument();
  });

  it("closes on Escape by default", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("can disable Escape closing", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog({ closeOnEscape: false });

    await user.keyboard("{Escape}");

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes on backdrop click by default", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("presentation"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps focus inside the dialog with tab navigation", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => expect(screen.getByRole("button", { name: "Focusable content" })).toHaveFocus());

    await user.tab();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Focusable content" })).toHaveFocus();
  });
});
