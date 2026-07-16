import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Navigation } from "./Navigation";

const items = [
  { label: "Overview", value: "overview" },
  { label: "Reports", value: "reports" },
  { disabled: true, label: "Billing", value: "billing" },
];

describe("Navigation", () => {
  it("renders items and selects the first enabled item by default", () => {
    render(<Navigation items={items} />);

    expect(screen.getByRole("navigation", { name: "Navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Billing" })).toBeDisabled();
  });

  it("supports uncontrolled selection", async () => {
    const user = userEvent.setup();

    render(<Navigation items={items} />);

    await user.click(screen.getByRole("button", { name: "Reports" }));

    expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-current", "page");
  });

  it("supports controlled selection callbacks", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Navigation items={items} onValueChange={onValueChange} value="reports" />);

    expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("button", { name: "Overview" }));

    expect(onValueChange).toHaveBeenCalledWith("overview", items[0]);
    expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-current", "page");
  });

  it("renders grouped items", () => {
    render(
      <Navigation
        items={[
          { label: "Workspace", items: items.slice(0, 2) },
          { label: "Admin", items: [items[2]] },
        ]}
      />,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
  });

  it("supports links", () => {
    render(<Navigation items={[{ href: "/reports", label: "Reports", value: "reports" }]} />);

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute("href", "/reports");
  });

  it("moves focus with vertical arrow keys and skips disabled items", async () => {
    const user = userEvent.setup();

    render(<Navigation items={items} />);

    screen.getByRole("button", { name: "Overview" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("button", { name: "Reports" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("button", { name: "Overview" })).toHaveFocus();
  });

  it("moves focus with horizontal arrow keys", async () => {
    const user = userEvent.setup();

    render(<Navigation items={items} orientation="horizontal" />);

    screen.getByRole("button", { name: "Overview" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("button", { name: "Reports" })).toHaveFocus();
  });

  it("supports Home and End keys", async () => {
    const user = userEvent.setup();

    render(<Navigation items={items} />);

    screen.getByRole("button", { name: "Overview" }).focus();
    await user.keyboard("{End}");

    expect(screen.getByRole("button", { name: "Reports" })).toHaveFocus();

    await user.keyboard("{Home}");

    expect(screen.getByRole("button", { name: "Overview" })).toHaveFocus();
  });

  it("selects focused item with Enter or Space", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Navigation items={items} onValueChange={onValueChange} />);

    screen.getByRole("button", { name: "Reports" }).focus();
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("reports", items[1]);
    expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing for an empty item list", () => {
    const { container } = render(<Navigation items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
