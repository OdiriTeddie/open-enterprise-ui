import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./useToast";
import type { Toast, ToastContextValue, ToastId, ToastInput, ToastProviderProps } from "./types";

export function ToastProvider({ children, defaultDuration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id: ToastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = toast.id ?? `toast-${nextIdRef.current++}`;
    const nextToast: Toast = {
      description: toast.description,
      duration: toast.duration ?? defaultDuration,
      id,
      title: toast.title,
      variant: toast.variant ?? "info",
    };

    setToasts((currentToasts) => [nextToast, ...currentToasts.filter((currentToast) => currentToast.id !== id)]);

    return id;
  }, [defaultDuration]);

  const value = useMemo<ToastContextValue>(
    () => ({ dismissToast, showToast, toasts }),
    [dismissToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
