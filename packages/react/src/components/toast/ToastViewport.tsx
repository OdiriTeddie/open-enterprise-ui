import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { Toast, ToastAction, ToastActionsRenderContext, ToastPosition, ToastRenderContext, ToastViewportProps, ToastVariant } from "./types";
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

const positionClasses: Record<ToastPosition, string> = {
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "top-center": "left-1/2 top-4 -translate-x-1/2",
  "top-left": "left-4 top-4",
  "top-right": "right-4 top-4",
};

const variantLabels: Record<ToastVariant, string> = {
  error: "Error",
  info: "Info",
  success: "Success",
  warning: "Warning",
};

export function ToastViewport({
  className = "",
  position = "top-right",
  renderActions,
  renderContent,
  renderIcon,
  renderToast,
}: ToastViewportProps) {
  const { dismissToast, toasts } = useToast();

  return (
    <div
      aria-label="Notifications"
      className={`fixed z-50 flex w-full max-w-sm flex-col gap-3 ${positionClasses[position]} ${className}`}
      role="region"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          onDismiss={dismissToast}
          renderActions={renderActions}
          renderContent={renderContent}
          renderIcon={renderIcon}
          renderToast={renderToast}
          toast={toast}
        />
      ))}
    </div>
  );
}

function ToastItem({
  onDismiss,
  renderActions,
  renderContent,
  renderIcon,
  renderToast,
  toast,
}: {
  onDismiss: (id: string) => void;
  renderActions?: (context: ToastActionsRenderContext) => ReactNode;
  renderContent?: (context: ToastRenderContext) => ReactNode;
  renderIcon?: (context: ToastRenderContext) => ReactNode;
  renderToast?: (context: ToastRenderContext) => ReactNode;
  toast: Toast;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [isPaused, setIsPaused] = useState(false);
  const remainingDurationRef = useRef<number | null>(toast.duration ?? null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    remainingDurationRef.current = toast.duration ?? null;
    startedAtRef.current = null;
  }, [toast.duration, toast.id]);

  useEffect(() => {
    const remainingDuration = remainingDurationRef.current;

    if (toast.duration === null || isPaused || remainingDuration === null) {
      return undefined;
    }

    startedAtRef.current = Date.now();
    const timeoutId = window.setTimeout(() => dismiss(), remainingDuration);

    return () => window.clearTimeout(timeoutId);
  });

  const isAssertive = toast.variant === "error" || toast.variant === "warning";
  const hasActions = Boolean(toast.primaryAction || toast.secondaryAction);

  function dismiss() {
    onDismiss(toast.id);
  }

  function handlePause() {
    if (toast.duration === null || isPaused) {
      return;
    }

    const startedAt = startedAtRef.current;
    const remainingDuration = remainingDurationRef.current;
    if (startedAt && remainingDuration !== null) {
      remainingDurationRef.current = Math.max(0, remainingDuration - (Date.now() - startedAt));
    }

    setIsPaused(true);
  }

  function handleResume() {
    if (toast.duration !== null) {
      setIsPaused(false);
    }
  }

  function handleActionSelect(action: ToastAction) {
    action.onSelect();
    dismiss();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
    }
  }

  const renderContext: ToastRenderContext = { dismiss, toast };
  const actionsContext: ToastActionsRenderContext = {
    ...renderContext,
    primaryAction: toast.primaryAction,
    secondaryAction: toast.secondaryAction,
    selectAction: handleActionSelect,
  };

  return (
    <div
      aria-describedby={toast.description ? descriptionId : undefined}
      aria-label={toast.ariaLabel}
      aria-labelledby={toast.ariaLabel ? undefined : titleId}
      aria-live={isAssertive ? "assertive" : "polite"}
      className={`rounded-md border p-4 shadow-lg transition motion-reduce:transition-none ${variantClasses[toast.variant]}`}
      onBlur={handleResume}
      onFocus={handlePause}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      role={isAssertive ? "alert" : "status"}
    >
      {renderToast ? renderToast(renderContext) : (
        <div className="flex items-start gap-3">
          {renderIcon ? <div aria-hidden="true" className="shrink-0">{renderIcon(renderContext)}</div> : null}
          <div className="flex-1">
            {renderContent ? renderContent(renderContext) : (
              <>
                <p className="text-xs font-semibold uppercase text-current opacity-75">{variantLabels[toast.variant]}</p>
                <div className="mt-1 text-sm font-semibold" id={titleId}>{toast.title}</div>
                {toast.description ? <div className="mt-1 text-sm opacity-85" id={descriptionId}>{toast.description}</div> : null}
              </>
            )}
            {hasActions ? (
              renderActions ? renderActions(actionsContext) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {toast.primaryAction ? <ToastActionButton action={toast.primaryAction} onSelect={handleActionSelect} priority="primary" /> : null}
                  {toast.secondaryAction ? <ToastActionButton action={toast.secondaryAction} onSelect={handleActionSelect} priority="secondary" /> : null}
                </div>
              )
            ) : null}
          </div>
          <button
            aria-label={`Dismiss ${String(toast.ariaLabel ?? toast.title)} notification`}
            className="rounded p-1 text-current opacity-70 outline-none transition hover:opacity-100 focus:ring-2 focus:ring-current"
            onClick={dismiss}
            type="button"
          >
            <span aria-hidden="true">x</span>
          </button>
        </div>
      )}
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
