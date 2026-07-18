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


function ActionTrigger({ onDismiss, onPrimary, onSecondary }: { onDismiss?: () => void; onPrimary: () => void; onSecondary: () => void }) {
  const { showToast } = useToast();

  return (
    <button
      onClick={() => showToast({
        duration: null,
        onDismiss,
        primaryAction: { label: "Retry", onSelect: onPrimary },
        secondaryAction: { label: "Details", onSelect: onSecondary },
        title: "Upload failed",
        variant: "error",
      })}
      type="button"
    >
      Show action toast
    </button>
  );
}

function ClearTrigger() {
  const { clearToasts, showToast } = useToast();

  return (
    <>
      <button onClick={() => showToast({ id: "first", title: "First" })} type="button">Show first</button>
      <button onClick={() => showToast({ id: "second", title: "Second" })} type="button">Show second</button>
      <button onClick={clearToasts} type="button">Clear all</button>
    </>
  );
}


function StackTrigger() {
  const { showToast } = useToast();

  return (
    <>
      <button onClick={() => showToast({ id: "first", title: "First" })} type="button">Show first stack</button>
      <button onClick={() => showToast({ id: "second", title: "Second" })} type="button">Show second stack</button>
      <button onClick={() => showToast({ id: "third", title: "Third" })} type="button">Show third stack</button>
    </>
  );
}


function AccessibleTrigger() {
  const { showToast } = useToast();

  return (
    <button
      onClick={() => showToast({ ariaLabel: "Upload failure notice", description: "File limit exceeded.", duration: null, title: "Upload failed", variant: "error" })}
      type="button"
    >
      Show accessible toast
    </button>
  );
}


function UpdateTrigger() {
  const { showToast, updateToast } = useToast();

  return (
    <>
      <button onClick={() => showToast({ id: "sync", title: "Syncing", variant: "info" })} type="button">Show update toast</button>
      <button onClick={() => updateToast("sync", { description: "All records are current.", title: "Sync complete", variant: "success" })} type="button">Update toast</button>
    </>
  );
}

function PromiseSuccessTrigger({ promise }: { promise: Promise<string> }) {
  const { toastPromise } = useToast();

  return (
    <button
      onClick={() => void toastPromise(promise, {
        loading: { title: "Saving changes", variant: "info" },
        success: (value) => ({ description: value, title: "Changes saved", variant: "success" }),
        error: { title: "Save failed", variant: "error" },
      })}
      type="button"
    >
      Run success promise
    </button>
  );
}

function PromiseErrorTrigger({ promise }: { promise: Promise<string> }) {
  const { toastPromise } = useToast();

  return (
    <button
      onClick={() => void toastPromise(promise, {
        loading: { title: "Uploading file", variant: "info" },
        success: { title: "Upload complete", variant: "success" },
        error: (error) => ({ description: error instanceof Error ? error.message : "Unknown error", title: "Upload failed", variant: "error" }),
      }).catch(() => undefined)}
      type="button"
    >
      Run error promise
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
    await user.click(screen.getByRole("button", { name: "Dismiss Saved notification" }));

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


  it("renders toast actions and dismisses after primary action selection", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <ToastProvider>
        <ActionTrigger onDismiss={onDismiss} onPrimary={onPrimary} onSecondary={onSecondary} />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show action toast" }));
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("runs secondary toast actions", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <ToastProvider>
        <ActionTrigger onPrimary={onPrimary} onSecondary={onSecondary} />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show action toast" }));
    await user.click(screen.getByRole("button", { name: "Details" }));

    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(onPrimary).not.toHaveBeenCalled();
  });

  it("keeps persistent toasts visible until dismissed", () => {
    vi.useFakeTimers();
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <ToastProvider>
        <ActionTrigger onPrimary={onPrimary} onSecondary={onSecondary} />
        <ToastViewport />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show action toast" }));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
  });

  it("clears all toasts", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ClearTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show first" }));
    await user.click(screen.getByRole("button", { name: "Show second" }));

    expect(screen.getAllByRole("status")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });


  it("applies viewport placement classes", () => {
    render(
      <ToastProvider>
        <ToastViewport position="bottom-center" />
      </ToastProvider>,
    );

    expect(screen.getByRole("region", { name: "Notifications" })).toHaveClass("bottom-4");
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveClass("left-1/2");
  });

  it("stacks newest toasts first by default", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <StackTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show first stack" }));
    await user.click(screen.getByRole("button", { name: "Show second stack" }));

    const toasts = screen.getAllByRole("status");
    expect(toasts[0]).toHaveTextContent("Second");
    expect(toasts[1]).toHaveTextContent("First");
  });

  it("supports oldest-first stack order", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider order="oldest-first">
        <StackTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show first stack" }));
    await user.click(screen.getByRole("button", { name: "Show second stack" }));

    const toasts = screen.getAllByRole("status");
    expect(toasts[0]).toHaveTextContent("First");
    expect(toasts[1]).toHaveTextContent("Second");
  });

  it("limits the number of visible toasts", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider maxToasts={2}>
        <StackTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show first stack" }));
    await user.click(screen.getByRole("button", { name: "Show second stack" }));
    await user.click(screen.getByRole("button", { name: "Show third stack" }));

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("Third")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText("First")).not.toBeInTheDocument();
  });

  it("pauses auto-dismiss while hovered and resumes when unhovered", () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <DurationTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show timed toast" }));
    const toast = screen.getByRole("status");

    act(() => {
      vi.advanceTimersByTime(400);
    });

    fireEvent.mouseEnter(toast);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Sync complete");

    fireEvent.mouseLeave(toast);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });


  it("uses toast title and description for accessible naming", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByRole("status", { name: "Saved" })).toBeInTheDocument();
    expect(screen.getByRole("status", { description: "The record was saved." })).toBeInTheDocument();
  });

  it("supports a custom accessible label", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <AccessibleTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show accessible toast" }));

    expect(screen.getByRole("alert", { name: "Upload failure notice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss Upload failure notice notification" })).toBeInTheDocument();
  });

  it("dismisses a focused toast with Escape", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    const toast = screen.getByRole("status", { name: "Saved" });
    screen.getByRole("button", { name: "Dismiss Saved notification" }).focus();
    await user.keyboard("{Escape}");

    expect(toast).not.toBeInTheDocument();
  });

  it("keeps toast action buttons keyboard operable", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <ToastProvider>
        <ActionTrigger onPrimary={onPrimary} onSecondary={onSecondary} />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show action toast" }));
    screen.getByRole("button", { name: "Retry" }).focus();
    await user.keyboard("{Enter}");

    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("includes reduced-motion safe transition classes", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByRole("status", { name: "Saved" })).toHaveClass("motion-reduce:transition-none");
  });


  it("updates an existing toast by id", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <UpdateTrigger />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show update toast" }));
    await user.click(screen.getByRole("button", { name: "Update toast" }));

    expect(screen.getByRole("status", { name: "Sync complete" })).toHaveTextContent("All records are current.");
    expect(screen.queryByText("Syncing")).not.toBeInTheDocument();
  });

  it("moves promise toasts from loading to success", async () => {
    const user = userEvent.setup();
    let resolvePromise!: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    render(
      <ToastProvider>
        <PromiseSuccessTrigger promise={promise} />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Run success promise" }));

    expect(screen.getByRole("status", { name: "Saving changes" })).toBeInTheDocument();

    await act(async () => {
      resolvePromise("Saved 12 accounts.");
      await promise;
    });

    expect(screen.getByRole("status", { name: "Changes saved" })).toHaveTextContent("Saved 12 accounts.");
    expect(screen.queryByText("Saving changes")).not.toBeInTheDocument();
  });

  it("moves promise toasts from loading to error", async () => {
    const user = userEvent.setup();
    let rejectPromise!: (error: Error) => void;
    const promise = new Promise<string>((_resolve, reject) => {
      rejectPromise = reject;
    });

    render(
      <ToastProvider>
        <PromiseErrorTrigger promise={promise} />
        <ToastViewport />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Run error promise" }));

    expect(screen.getByRole("status", { name: "Uploading file" })).toBeInTheDocument();

    await act(async () => {
      rejectPromise(new Error("Network unavailable."));
      await promise.catch(() => undefined);
    });

    expect(screen.getByRole("alert", { name: "Upload failed" })).toHaveTextContent("Network unavailable.");
    expect(screen.queryByText("Uploading file")).not.toBeInTheDocument();
  });


  it("renders custom toast icon and content slots", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport
          renderContent={({ toast }) => <div>Custom content: {toast.title}</div>}
          renderIcon={({ toast }) => <span>{toast.variant} icon</span>}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByText("Custom content: Saved")).toBeInTheDocument();
    expect(screen.getByText("success icon")).toBeInTheDocument();
  });

  it("renders custom toast actions with select helpers", async () => {
    const user = userEvent.setup();
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <ToastProvider>
        <ActionTrigger onPrimary={onPrimary} onSecondary={onSecondary} />
        <ToastViewport
          renderActions={({ primaryAction, selectAction }) => (
            <button onClick={() => primaryAction ? selectAction(primaryAction) : undefined} type="button">
              Custom retry
            </button>
          )}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show action toast" }));
    await user.click(screen.getByRole("button", { name: "Custom retry" }));

    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a full custom toast and exposes dismiss", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ToastTrigger />
        <ToastViewport
          renderToast={({ dismiss, toast }) => (
            <div>
              <strong>Rendered {toast.title}</strong>
              <button onClick={dismiss} type="button">Close custom toast</button>
            </div>
          )}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByText("Rendered Saved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close custom toast" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("throws when useToast is rendered outside ToastProvider", () => {
    expect(() => render(<InvalidConsumer />)).toThrow("useToast must be used within a ToastProvider.");
  });
});
