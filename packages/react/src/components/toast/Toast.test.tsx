import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, ToastViewport } from ".";
import { useToast } from "./useToast";

function ToastTrigger() {
  const { showToast } = useToast();

  return (
    <button
      onClick={() => showToast({ description: "The record was saved.", title: "Saved", variant: "success" })}
      type="button"
    >
      Show toast
    </button>
  );
}

function DurationTrigger() {
  const { showToast } = useToast();

  return (
    <button onClick={() => showToast({ duration: 1000, title: "Sync complete" })} type="button">
      Show timed toast
    </button>
  );
}

function ErrorTrigger() {
  const { showToast } = useToast();

  return (
    <button onClick={() => showToast({ title: "Upload failed", variant: "error" })} type="button">
      Show error
    </button>
  );
}

function DuplicateTrigger() {
  const { showToast } = useToast();

  return (
    <button onClick={() => showToast({ id: "sync", title: "Updated sync toast" })} type="button">
      Show duplicate
    </button>
  );
}

function InvalidConsumer() {
  useToast();
  return null;
}

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders toasts from the provider hook", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.getByText("The record was saved.")).toBeInTheDocument();
  });

  it("dismisses toasts manually", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("auto-dismisses toasts after their duration", () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <DurationTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show timed toast" }));

    expect(screen.getByRole("status")).toHaveTextContent("Sync complete");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("uses alert semantics for error toasts", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ErrorTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show error" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("replaces a toast with the same id", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <DuplicateTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show duplicate" }));
    await user.click(screen.getByRole("button", { name: "Show duplicate" }));

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Updated sync toast");
  });

  it("throws when useToast is rendered outside ToastProvider", () => {
    expect(() => render(<InvalidConsumer />)).toThrow("useToast must be used within a ToastProvider.");
  });
});
