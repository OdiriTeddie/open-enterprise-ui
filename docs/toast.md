# Toast API

`Toast` provides app-level notifications for async workflows, saves, errors, and background status updates.

## Import

```tsx
import { ToastProvider, ToastViewport, useToast } from "@open-enterprise-ui/react";
```

## Basic Usage

Wrap the app or route area with `ToastProvider`, render a `ToastViewport`, and call `showToast` from components inside the provider.

```tsx
function AppShell() {
  return (
    <ToastProvider>
      <SaveButton />
      <ToastViewport />
    </ToastProvider>
  );
}

function SaveButton() {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        showToast({
          title: "Changes saved",
          description: "The customer record was updated.",
          variant: "success",
        })
      }
    >
      Save
    </button>
  );
}
```

## Provider Props

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `ReactNode` | Provider contents. |
| `defaultDuration` | `number` | Default auto-dismiss duration in milliseconds. Defaults to `5000`. |

## Viewport Props

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` | Additional class names for the fixed notification viewport. |

## Hook API

```ts
type ToastContextValue = {
  toasts: Toast[];
  showToast: (toast: ToastInput) => ToastId;
  dismissToast: (id: ToastId) => void;
};
```

## Toast Input

```ts
type ToastInput = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  duration?: number;
};
```

`showToast` returns the toast id. Passing the same `id` again replaces the previous toast with that id.

## Variants

| Variant | Semantics |
| --- | --- |
| `info` | Neutral status message. |
| `success` | Completed workflow. |
| `warning` | Needs attention. |
| `error` | Failed workflow or blocking issue. |

## Accessibility

`ToastViewport` renders a `role="region"` labelled `Notifications`. Info and success toasts render `role="status"` with polite live-region behavior. Warning and error toasts render `role="alert"` with assertive live-region behavior. Every toast includes a labelled dismiss button.
