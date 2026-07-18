import type { ReactNode } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastId = string;

export type ToastDuration = number | null;

export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

export type ToastOrder = "newest-first" | "oldest-first";

export type ToastAction = {
  label: ReactNode;
  onSelect: () => void;
};

export type Toast = {
  ariaLabel?: string;
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
  ariaLabel?: string;
  description?: ReactNode;
  duration?: ToastDuration;
  id?: ToastId;
  onDismiss?: () => void;
  primaryAction?: ToastAction;
  secondaryAction?: ToastAction;
  title: ReactNode;
  variant?: ToastVariant;
};

export type ToastUpdate = Partial<Omit<ToastInput, "id">>;

export type ToastPromiseState<TValue = unknown> = ToastInput | ((value: TValue) => ToastInput);

export type ToastPromiseErrorState = ToastInput | ((error: unknown) => ToastInput);

export type ToastPromiseOptions<TValue = unknown> = {
  error: ToastPromiseErrorState;
  loading: ToastInput;
  success: ToastPromiseState<TValue>;
};

export type ToastContextValue = {
  clearToasts: () => void;
  dismissToast: (id: ToastId) => void;
  showToast: (toast: ToastInput) => ToastId;
  toastPromise: <TValue>(promise: Promise<TValue>, options: ToastPromiseOptions<TValue>) => Promise<TValue>;
  toasts: Toast[];
  updateToast: (id: ToastId, toast: ToastUpdate) => void;
};

export type ToastProviderProps = {
  children: ReactNode;
  defaultDuration?: number;
  maxToasts?: number;
  order?: ToastOrder;
};

export type ToastViewportProps = {
  className?: string;
  position?: ToastPosition;
};
