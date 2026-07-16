import { useEffect, useId, useRef } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";

export type DialogSize = "sm" | "md" | "lg" | "xl";

export type DialogProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  description?: ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  labelledById?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  size?: DialogSize;
  title?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "title">;

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const focusableSelector = [
  "a[href]",
  "button:not(:disabled)",
  "textarea:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Dialog({
  actions,
  children,
  className = "",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  description,
  initialFocusRef,
  labelledById,
  onOpenChange,
  open,
  size = "md",
  title,
  ...dialogProps
}: DialogProps) {
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);
  const titleId = labelledById ?? generatedTitleId;
  const descriptionId = description ? generatedDescriptionId : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current = document.activeElement;

    window.requestAnimationFrame(() => {
      const focusTarget = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(focusableSelector) ?? panelRef.current;
      focusTarget?.focus();
    });

    return () => {
      const previousActiveElement = previousActiveElementRef.current;

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [initialFocusRef, open]);

  if (!open) {
    return null;
  }

  function handleBackdropClick() {
    if (closeOnBackdropClick) {
      onOpenChange(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && closeOnEscape) {
      event.stopPropagation();
      onOpenChange(false);
      return;
    }

    if (event.key !== "Tab" || !panelRef.current) {
      return;
    }

    const focusableElements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));

    if (focusableElements.length === 0) {
      event.preventDefault();
      panelRef.current.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={`max-h-full w-full overflow-hidden rounded-md bg-white text-gray-900 shadow-xl outline-none ${sizeClasses[size]} ${className}`}
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        {...dialogProps}
      >
        {title || description ? (
          <header className="border-b border-gray-200 px-5 py-4">
            {title ? <h2 className="text-base font-semibold text-gray-900" id={titleId}>{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-gray-600" id={descriptionId}>{description}</p> : null}
          </header>
        ) : null}

        <div className="px-5 py-4 text-sm text-gray-700">{children}</div>

        {actions ? <footer className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">{actions}</footer> : null}
      </div>
    </div>
  );
}
