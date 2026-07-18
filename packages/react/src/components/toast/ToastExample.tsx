import { ToastProvider } from "./ToastProvider";
import { ToastViewport } from "./ToastViewport";
import { useToast } from "./useToast";

function ToastExampleContent() {
  const { clearToasts, showToast } = useToast();

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          onClick={() => showToast({ description: "The customer record was updated.", title: "Changes saved", variant: "success" })}
          type="button"
        >
          Show success
        </button>
        <button
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => showToast({
            description: "Upload failed because the file is too large.",
            duration: null,
            primaryAction: { label: "Retry", onSelect: () => undefined },
            secondaryAction: { label: "View details", onSelect: () => undefined },
            title: "Upload failed",
            variant: "error",
          })}
          type="button"
        >
          Show action toast
        </button>
        <button
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={clearToasts}
          type="button"
        >
          Clear all
        </button>
      </div>
      <ToastViewport className="absolute" />
    </div>
  );
}

export function ToastExample() {
  return (
    <ToastProvider>
      <ToastExampleContent />
    </ToastProvider>
  );
}
