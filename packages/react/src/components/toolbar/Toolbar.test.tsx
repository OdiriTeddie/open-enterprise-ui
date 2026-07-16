import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "./Toolbar";
import type { ToolbarItem } from "./types";

const items: ToolbarItem[] = [
  { id: "new", label: "New", variant: "primary" },
  { id: "upload", label: "Upload" },
  { id: "separator", type: "separator" },
  { id: "filter", label: "Filter", pressed: true },
  { disabled: true, id: "delete", label: "Delete", variant: "danger" },
];

describe("Toolbar", () => {
  it("renders actions, separators, and slots", () => {
    render(
      <Toolbar
        ariaLabel="File commands"
        items={items}
        leading={<span>Files</span>}
        trailing={<span>3 selected</span>}
      />,
    );

    expect(screen.getByRole("toolbar", { name: "File commands" })).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });

  it("calls action handlers", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Toolbar items={[{ id: "refresh", label: "Refresh", onSelect }]} />);

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not call disabled action handlers", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Toolbar items={[{ disabled: true, id: "delete", label: "Delete", onSelect }]} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("sets pressed state on toggle-like actions", () => {
    render(<Toolbar items={items} />);

    expect(screen.getByRole("button", { name: "Filter" })).toHaveAttribute("aria-pressed", "true");
  });

  it("supports vertical orientation", () => {
    render(<Toolbar items={items} orientation="vertical" />);

    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-orientation", "vertical");
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("applies tooltip text as the button title", () => {
    render(<Toolbar items={[{ id: "upload", label: "Upload", tooltip: "Upload files" }]} />);

    expect(screen.getByRole("button", { name: "Upload" })).toHaveAttribute("title", "Upload files");
  });
});
