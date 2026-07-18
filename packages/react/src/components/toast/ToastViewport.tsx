import { useEffect } from "react";
import type { Toast, ToastAction, ToastViewportProps, ToastVariant } from "./types";
import { useToast } from "./useToast";

const variantClasses: Record<ToastVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

const actionClasses = {
  primary: "bg-current px-3 py-1.5 text-white hover:opacity-90",
  secondary: "border border-current px-3 py-1.5 text-current hover:bg-white/50",
};

const variantLabels: Record<ToastVariant, string> = {
  error: "Error",
  info: "Info",
  success: "Success",
  warning: "Warning",
};

export function ToastViewport({ className = "" }: ToastViewportProps) {
  const { dismissToast, toasts } = useToast();

  return (
    <div
      aria-label="Notifications"
      className={`fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3 ${className}`}
      role="region"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} onDismiss={dismissToast} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ onDismiss, toast }: { onDismiss: (id: string) => void; toast: Toast }) {
  useEffect(() => {
    if (toast.duration === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => onDismiss(toast.id), toast.duration);

    return () => window.clearTimeout(timeoutId);
  }, [onDismiss, toast.duration, toast.id]);

  const isAssertive = toast.variant === "error" || toast.variant === "warning";
  const hasActions = Boolean(toast.primaryAction || toast.secondaryAction);

  function handleActionSelect(action: ToastAction) {
    action.onSelect();
    onDismiss(toast.id);
  }

  return (
    <div
      aria-live={isAssertive ? "assertive" : "polite"}
      className={`rounded-md border p-4 shadow-lg ${variantClasses[toast.variant]}`}
      role={isAssertive ? "alert" : "status"}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase text-current opacity-75">{variantLabels[toast.variant]}</p>
          <div className="mt-1 text-sm font-semibold">{toast.title}</div>
          {toast.description ? <div className="mt-1 text-sm opacity-85">{toast.description}</div> : null}
          {hasActions ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {toast.primaryAction ? <ToastActionButton action={toast.primaryAction} onSelect={handleActionSelect} priority="primary" /> : null}
              {toast.secondaryAction ? <ToastActionButton action={toast.secondaryAction} onSelect={handleActionSelect} priority="secondary" /> : null}
            </div>
          ) : null}
        </div>
        <button
          aria-label="Dismiss notification"
          className="rounded p-1 text-current opacity-70 outline-none transition hover:opacity-100 focus:ring-2 focus:ring-current"
          onClick={() => onDismiss(toast.id)}
          type="button"
        >
          x
        </button>
      </div>
    </div>
  );
}

function ToastActionButton({
  action,
  onSelect,
  priority,
}: {
  action: ToastAction;
  onSelect: (action: ToastAction) => void;
  priority: keyof typeof actionClasses;
}) {
  return (
    <button
      className={`rounded-md text-xs font-semibold outline-none transition focus:ring-2 focus:ring-current ${actionClasses[priority]}`}
      onClick={() => onSelect(action)}
      type="button"
    >
      {action.label}
    </button>
  );
}
