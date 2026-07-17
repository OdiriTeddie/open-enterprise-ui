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

  it("moves focus with horizontal arrow keys", async () => {
    const user = userEvent.setup();

    render(<Toolbar items={items} />);

    screen.getByRole("button", { name: "New" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("button", { name: "Upload" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("button", { name: "Filter" })).toHaveFocus();
  });

  it("moves focus with vertical arrow keys", async () => {
    const user = userEvent.setup();

    render(<Toolbar items={items} orientation="vertical" />);

    screen.getByRole("button", { name: "Filter" }).focus();
    await user.keyboard("{ArrowUp}");

    expect(screen.getByRole("button", { name: "Upload" })).toHaveFocus();
  });

  it("moves focus to first and last enabled actions", async () => {
    const user = userEvent.setup();

    render(<Toolbar items={items} />);

    screen.getByRole("button", { name: "New" }).focus();
    await user.keyboard("{End}");

    expect(screen.getByRole("button", { name: "Filter" })).toHaveFocus();

    await user.keyboard("{Home}");

    expect(screen.getByRole("button", { name: "New" })).toHaveFocus();
  });

  it("activates focused actions with keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Toolbar items={[{ id: "refresh", label: "Refresh", onSelect }]} />);

    screen.getByRole("button", { name: "Refresh" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenCalledTimes(2);
  });



  it("uses wrapping overflow by default", () => {
    render(<Toolbar items={items} />);

    expect(screen.getByRole("toolbar")).toHaveClass("flex-wrap");
  });

  it("supports horizontal scroll overflow", () => {
    render(<Toolbar items={items} overflow="scroll" overflowLabel="More commands may be available horizontally" />);

    expect(screen.getByRole("toolbar")).toHaveClass("flex-nowrap");
    expect(screen.getByRole("toolbar")).toHaveClass("overflow-x-auto");
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-description", "More commands may be available horizontally");
  });

  it("supports vertical scroll overflow", () => {
    render(<Toolbar items={items} orientation="vertical" overflow="scroll" />);

    expect(screen.getByRole("toolbar")).toHaveClass("overflow-y-auto");
  });

  it("opens a menu item and selects an option", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Toolbar
        items={[
          {
            id: "view",
            items: [{ id: "grid", label: "Grid", onSelect }],
            label: "View",
            type: "menu",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "View" }));

    expect(screen.getByRole("menu", { name: "View menu" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Grid" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu", { name: "View menu" })).not.toBeInTheDocument();
  });

  it("opens menus with keyboard and selects focused options", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Toolbar
        items={[
          {
            id: "view",
            items: [
              { id: "list", label: "List" },
              { id: "grid", label: "Grid", onSelect },
            ],
            label: "View",
            type: "menu",
          },
        ]}
      />,
    );

    screen.getByRole("button", { name: "View" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("menuitem", { name: "List" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Grid" })).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("closes open menus with Escape", async () => {
    const user = userEvent.setup();

    render(
      <Toolbar
        items={[
          {
            id: "view",
            items: [{ id: "list", label: "List" }],
            label: "View",
            type: "menu",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "View" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu", { name: "View menu" })).not.toBeInTheDocument();
  });

  it("closes open menus on outside click", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Toolbar
          items={[
            {
              id: "view",
              items: [{ id: "list", label: "List" }],
              label: "View",
              type: "menu",
            },
          ]}
        />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "View" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("menu", { name: "View menu" })).not.toBeInTheDocument();
  });

  it("renders selected menu options as menuitemcheckbox", async () => {
    const user = userEvent.setup();

    render(
      <Toolbar
        items={[
          {
            id: "density",
            items: [{ id: "compact", label: "Compact", selected: true }],
            label: "Density",
            type: "menu",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Density" }));

    expect(screen.getByRole("menuitemcheckbox", { name: "Compact" })).toHaveAttribute("aria-checked", "true");
  });

});
