import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./useToast";
import type { Toast, ToastContextValue, ToastId, ToastInput, ToastProviderProps } from "./types";

export function ToastProvider({ children, defaultDuration = 5000 }: ToastProviderProps) {
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
      description: toast.description,
      duration: toast.duration === undefined ? defaultDuration : toast.duration,
      id,
      onDismiss: toast.onDismiss,
      primaryAction: toast.primaryAction,
      secondaryAction: toast.secondaryAction,
      title: toast.title,
      variant: toast.variant ?? "info",
    };

    setToasts((currentToasts) => [nextToast, ...currentToasts.filter((currentToast) => currentToast.id !== id)]);

    return id;
  }, [defaultDuration]);

  const value = useMemo<ToastContextValue>(
    () => ({ clearToasts, dismissToast, showToast, toasts }),
    [clearToasts, dismissToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
