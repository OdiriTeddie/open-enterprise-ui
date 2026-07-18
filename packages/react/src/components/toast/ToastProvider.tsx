import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./useToast";
import type { Toast, ToastContextValue, ToastId, ToastInput, ToastOrder, ToastProviderProps } from "./types";

export function ToastProvider({ children, defaultDuration = 5000, maxToasts, order = "newest-first" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id: ToastId) => {
    setToasts((currentToasts) => {
      const toastToDismiss = currentToasts.find((toast) => toast.id === id);
      toastToDismiss?.onDismiss?.();

      return currentToasts.filter((toast) => toast.id !== id);
    });
  }, []);

  const clearToasts = useCallback(() => {
    setToasts((currentToasts) => {
      currentToasts.forEach((toast) => toast.onDismiss?.());
      return [];
    });
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = toast.id ?? `toast-${nextIdRef.current++}`;
    const nextToast: Toast = {
      ariaLabel: toast.ariaLabel,
      description: toast.description,
      duration: toast.duration === undefined ? defaultDuration : toast.duration,
      id,
      onDismiss: toast.onDismiss,
      primaryAction: toast.primaryAction,
      secondaryAction: toast.secondaryAction,
      title: toast.title,
      variant: toast.variant ?? "info",
    };

    setToasts((currentToasts) => limitToasts(insertToast(currentToasts, nextToast, order), maxToasts));

    return id;
  }, [defaultDuration, maxToasts, order]);

  const value = useMemo<ToastContextValue>(
    () => ({ clearToasts, dismissToast, showToast, toasts }),
    [clearToasts, dismissToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function insertToast(currentToasts: Toast[], nextToast: Toast, order: ToastOrder) {
  const existingToasts = currentToasts.filter((toast) => toast.id !== nextToast.id);

  return order === "newest-first" ? [nextToast, ...existingToasts] : [...existingToasts, nextToast];
}

function limitToasts(toasts: Toast[], maxToasts?: number) {
  if (maxToasts === undefined || maxToasts < 1) {
    return toasts;
  }

  return toasts.slice(0, maxToasts);
}
