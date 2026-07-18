import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./useToast";
import type {
  Toast,
  ToastContextValue,
  ToastId,
  ToastInput,
  ToastOrder,
  ToastPromiseOptions,
  ToastProviderProps,
  ToastUpdate,
} from "./types";

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
    const nextToast = createToast(id, toast, defaultDuration);

    setToasts((currentToasts) => limitToasts(insertToast(currentToasts, nextToast, order), maxToasts));

    return id;
  }, [defaultDuration, maxToasts, order]);

  const updateToast = useCallback((id: ToastId, toast: ToastUpdate) => {
    setToasts((currentToasts) => currentToasts.map((currentToast) => (
      currentToast.id === id ? mergeToast(currentToast, toast, defaultDuration) : currentToast
    )));
  }, [defaultDuration]);

  const toastPromise = useCallback(<TValue,>(promise: Promise<TValue>, options: ToastPromiseOptions<TValue>) => {
    const id = showToast({ ...options.loading, duration: options.loading.duration ?? null });

    promise.then(
      (value) => {
        updateToast(id, resolveToastState(options.success, value));
      },
      (error: unknown) => {
        updateToast(id, resolveToastState(options.error, error));
      },
    );

    return promise;
  }, [showToast, updateToast]);

  const value = useMemo<ToastContextValue>(
    () => ({ clearToasts, dismissToast, showToast, toastPromise, toasts, updateToast }),
    [clearToasts, dismissToast, showToast, toastPromise, toasts, updateToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function createToast(id: ToastId, toast: ToastInput, defaultDuration: number): Toast {
  return {
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
}

function mergeToast(currentToast: Toast, toast: ToastUpdate, defaultDuration: number): Toast {
  return {
    ...currentToast,
    ...toast,
    duration: toast.duration === undefined ? defaultDuration : toast.duration,
    variant: toast.variant ?? currentToast.variant,
  };
}

function resolveToastState<TValue>(toast: ToastInput | ((value: TValue) => ToastInput), value: TValue) {
  return typeof toast === "function" ? toast(value) : toast;
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
