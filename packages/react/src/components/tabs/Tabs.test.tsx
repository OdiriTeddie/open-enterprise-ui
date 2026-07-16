import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./Tabs";

const items = [
  { content: <div>Overview panel</div>, label: "Overview", value: "overview" },
  { content: <div>Members panel</div>, label: "Members", value: "members" },
  { content: <div>Audit panel</div>, label: "Audit", value: "audit" },
];

describe("Tabs", () => {
  it("renders the first enabled tab by default", () => {
    render(<Tabs items={items} />);

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Overview panel")).toBeInTheDocument();
    expect(screen.queryByText("Members panel")).not.toBeInTheDocument();
  });

  it("supports uncontrolled tab changes", async () => {
    const user = userEvent.setup();

    render(<Tabs items={items} />);

    await user.click(screen.getByRole("tab", { name: "Members" }));

    expect(screen.getByRole("tab", { name: "Members" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Members panel")).toBeInTheDocument();
  });

  it("supports controlled value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Tabs items={items} onValueChange={onValueChange} value="audit" />);

    expect(screen.getByRole("tab", { name: "Audit" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "Overview" }));

    expect(onValueChange).toHaveBeenCalledWith("overview");
    expect(screen.getByRole("tab", { name: "Audit" })).toHaveAttribute("aria-selected", "true");
  });

  it("skips disabled tabs", async () => {
    const user = userEvent.setup();

    render(
      <Tabs
        items={[
          items[0],
          { ...items[1], disabled: true },
          items[2],
        ]}
      />,
    );

    expect(screen.getByRole("tab", { name: "Members" })).toBeDisabled();

    screen.getByRole("tab", { name: "Overview" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Audit" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Audit" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports manual activation mode", async () => {
    const user = userEvent.setup();

    render(<Tabs activationMode="manual" items={items} />);

    screen.getByRole("tab", { name: "Overview" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Members" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");

    expect(screen.getByRole("tab", { name: "Members" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports Home and End keys", async () => {
    const user = userEvent.setup();

    render(<Tabs defaultValue="members" items={items} />);

    screen.getByRole("tab", { name: "Members" }).focus();
    await user.keyboard("{End}");

    expect(screen.getByRole("tab", { name: "Audit" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Audit" })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports vertical orientation keyboard navigation", async () => {
    const user = userEvent.setup();

    render(<Tabs items={items} orientation="vertical" />);

    const tablist = screen.getByRole("tablist", { name: "Tabs" });
    expect(tablist).toHaveAttribute("aria-orientation", "vertical");

    screen.getByRole("tab", { name: "Overview" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("tab", { name: "Members" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Members" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders nothing for an empty item list", () => {
    const { container } = render(<Tabs items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
