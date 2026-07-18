import type { ReactNode } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastId = string;

export type ToastDuration = number | null;

export type ToastAction = {
  label: ReactNode;
  onSelect: () => void;
};

export type Toast = {
  description?: ReactNode;
  duration?: ToastDuration;
  id: ToastId;
  onDismiss?: () => void;
  primaryAction?: ToastAction;
  secondaryAction?: ToastAction;
  title: ReactNode;
  variant: ToastVariant;
};

export type ToastInput = {
  description?: ReactNode;
  duration?: ToastDuration;
  id?: ToastId;
  onDismiss?: () => void;
  primaryAction?: ToastAction;
  secondaryAction?: ToastAction;
  title: ReactNode;
  variant?: ToastVariant;
};

export type ToastContextValue = {
  clearToasts: () => void;
  dismissToast: (id: ToastId) => void;
  showToast: (toast: ToastInput) => ToastId;
  toasts: Toast[];
};

export type ToastProviderProps = {
  children: ReactNode;
  defaultDuration?: number;
};

export type ToastViewportProps = {
  className?: string;
};
