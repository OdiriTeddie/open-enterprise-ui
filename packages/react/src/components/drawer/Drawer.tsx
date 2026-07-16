import { useEffect, useId, useRef } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";

export type DrawerSide = "left" | "right" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "xl";

export type DrawerProps = {
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
  side?: DrawerSide;
  size?: DrawerSize;
  title?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "title">;

const focusableSelector = [
  "a[href]",
  "button:not(:disabled)",
  "textarea:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const sideClasses: Record<DrawerSide, string> = {
  bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-md",
  left: "inset-y-0 left-0 h-full",
  right: "inset-y-0 right-0 h-full",
  top: "inset-x-0 top-0 max-h-[85vh] rounded-b-md",
};

const sizeClasses: Record<DrawerSide, Record<DrawerSize, string>> = {
  bottom: {
    sm: "h-64",
    md: "h-80",
    lg: "h-[28rem]",
    xl: "h-[36rem]",
  },
  left: {
    sm: "w-80",
    md: "w-96",
    lg: "w-[32rem]",
    xl: "w-[40rem]",
  },
  right: {
    sm: "w-80",
    md: "w-96",
    lg: "w-[32rem]",
    xl: "w-[40rem]",
  },
  top: {
    sm: "h-64",
    md: "h-80",
    lg: "h-[28rem]",
    xl: "h-[36rem]",
  },
};

export function Drawer({
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
  side = "right",
  size = "md",
  title,
  ...drawerProps
}: DrawerProps) {
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
    <div className="fixed inset-0 z-50 bg-black/40" onClick={handleBackdropClick} onKeyDown={handleKeyDown} role="presentation">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={`absolute flex max-w-full flex-col overflow-hidden bg-white text-gray-900 shadow-xl outline-none ${sideClasses[side]} ${sizeClasses[side][size]} ${className}`}
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        {...drawerProps}
      >
        {title || description ? (
          <header className="border-b border-gray-200 px-5 py-4">
            {title ? <h2 className="text-base font-semibold text-gray-900" id={titleId}>{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-gray-600" id={descriptionId}>{description}</p> : null}
          </header>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4 text-sm text-gray-700">{children}</div>

        {actions ? <footer className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">{actions}</footer> : null}
      </div>
    </div>
  );
}
