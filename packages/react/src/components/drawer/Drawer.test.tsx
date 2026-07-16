import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";

function renderDrawer(overrides = {}) {
  const onOpenChange = vi.fn();

  render(
    <Drawer
      actions={<button type="button">Save</button>}
      description="Edit workspace metadata."
      onOpenChange={onOpenChange}
      open
      title="Workspace settings"
      {...overrides}
    >
      <button type="button">Focusable content</button>
    </Drawer>,
  );

  return { onOpenChange };
}

describe("Drawer", () => {
  it("renders an accessible drawer with title, description, content, and actions", () => {
    renderDrawer();

    const drawer = screen.getByRole("dialog", { name: "Workspace settings" });

    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Edit workspace metadata.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Focusable content" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Drawer onOpenChange={vi.fn()} open={false} title="Hidden drawer">
        Hidden content
      </Drawer>,
    );

    expect(screen.queryByRole("dialog", { name: "Hidden drawer" })).not.toBeInTheDocument();
  });

  it("closes on Escape by default", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer();

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("can disable Escape closing", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer({ closeOnEscape: false });

    await user.keyboard("{Escape}");

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes on backdrop click by default", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDrawer();

    await user.click(screen.getByRole("presentation"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("supports side and size classes", () => {
    renderDrawer({ side: "left", size: "lg" });

    const drawer = screen.getByRole("dialog", { name: "Workspace settings" });

    expect(drawer).toHaveClass("left-0");
    expect(drawer).toHaveClass("w-[32rem]");
  });

  it("keeps focus inside the drawer with tab navigation", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await waitFor(() => expect(screen.getByRole("button", { name: "Focusable content" })).toHaveFocus());

    await user.tab();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Focusable content" })).toHaveFocus();
  });
});
