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
| `maxToasts` | `number` | Maximum number of visible toasts. Extra toasts are trimmed from the end of the ordered stack. |
| `order` | `"newest-first" \| "oldest-first"` | Controls stack order. Defaults to `"newest-first"`. |

## Viewport Props

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` | Additional class names for the fixed notification viewport. |
| `position` | `"top-right" \| "top-left" \| "bottom-right" \| "bottom-left" \| "top-center" \| "bottom-center"` | Viewport placement. Defaults to `"top-right"`. |
| `renderIcon` | `(context: ToastRenderContext) => ReactNode` | Custom icon slot for the default toast layout. |
| `renderContent` | `(context: ToastRenderContext) => ReactNode` | Custom title/body content for the default toast layout. |
| `renderActions` | `(context: ToastActionsRenderContext) => ReactNode` | Custom action rendering for the default toast layout. |
| `renderToast` | `(context: ToastRenderContext) => ReactNode` | Full toast body override inside the accessible toast shell. |

## Hook API

```ts
type ToastContextValue = {
  toasts: Toast[];
  showToast: (toast: ToastInput) => ToastId;
  updateToast: (id: ToastId, toast: ToastUpdate) => void;
  toastPromise: <TValue>(promise: Promise<TValue>, options: ToastPromiseOptions<TValue>) => Promise<TValue>;
  dismissToast: (id: ToastId) => void;
  clearToasts: () => void;
};
```

## Toast Input

```ts
type ToastAction = {
  label: ReactNode;
  onSelect: () => void;
};

type ToastInput = {
  id?: string;
  ariaLabel?: string;
  title: ReactNode;
  description?: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  duration?: number | null;
  primaryAction?: ToastAction;
  secondaryAction?: ToastAction;
  onDismiss?: () => void;
};
```

`showToast` returns the toast id. Passing the same `id` again replaces the previous toast with that id. Use `duration: null` for persistent toasts that only dismiss through an action, the dismiss button, or `dismissToast`.





## Composition

Use render slots when product teams need custom visuals while keeping the provider, timers, placement, stacking, and accessibility shell.

```tsx
<ToastViewport
  renderIcon={({ toast }) => <StatusIcon variant={toast.variant} />}
  renderContent={({ toast }) => (
    <div>
      <strong>{toast.title}</strong>
      {toast.description ? <p>{toast.description}</p> : null}
    </div>
  )}
  renderActions={({ primaryAction, selectAction }) => (
    primaryAction ? <button onClick={() => selectAction(primaryAction)}>{primaryAction.label}</button> : null
  )}
/>
```

Use `renderToast` for a full body override. The accessible toast shell, live-region semantics, Escape dismissal, hover/focus timer pause, and placement remain managed by `ToastViewport`.

```tsx
<ToastViewport
  renderToast={({ dismiss, toast }) => (
    <div>
      <strong>{toast.title}</strong>
      <button onClick={dismiss}>Close</button>
    </div>
  )}
/>
```

## Promise Helpers

Use `updateToast` when a workflow has an existing toast id and needs to replace its content.

```tsx
const id = showToast({ title: "Syncing", variant: "info", duration: null });

updateToast(id, {
  title: "Sync complete",
  description: "All records are current.",
  variant: "success",
});
```

Use `toastPromise` for async workflows. It shows the loading toast immediately, then updates the same toast when the promise resolves or rejects. The helper returns the original promise so callers can continue awaiting it.

```tsx
await toastPromise(saveCustomer(customer), {
  loading: { title: "Saving customer", variant: "info" },
  success: { title: "Customer saved", variant: "success" },
  error: (error) => ({
    title: "Save failed",
    description: error instanceof Error ? error.message : "Please try again.",
    variant: "error",
  }),
});
```

Loading promise toasts are persistent by default unless `loading.duration` is provided.

## Placement and Stacking

Use `position` on `ToastViewport` to place notifications and provider props to control stack behavior.

```tsx
<ToastProvider maxToasts={3} order="newest-first">
  <ToastViewport position="bottom-right" />
</ToastProvider>
```

Available positions are `top-right`, `top-left`, `bottom-right`, `bottom-left`, `top-center`, and `bottom-center`. Auto-dismiss timers pause while a toast is hovered or focused, so users can read content and interact with actions without racing the timeout.

## Actions

Toasts can include one primary and one secondary action. Selecting an action calls its `onSelect` handler and dismisses the toast.

```tsx
showToast({
  title: "Upload failed",
  description: "The file is larger than the upload limit.",
  variant: "error",
  duration: null,
  primaryAction: { label: "Retry", onSelect: retryUpload },
  secondaryAction: { label: "View details", onSelect: openUploadDetails },
  onDismiss: trackDismiss,
});
```

Use `dismissToast(id)` to close one toast and `clearToasts()` to close all visible toasts. Dismiss callbacks run for manual dismiss, auto-dismiss, action dismiss, and clear-all dismiss.

## Variants

| Variant | Semantics |
| --- | --- |
| `info` | Neutral status message. |
| `success` | Completed workflow. |
| `warning` | Needs attention. |
| `error` | Failed workflow or blocking issue. |


## Integration Examples

### Toolbar Action

Use `showToast` inside toolbar commands to report background actions.

```tsx
function Commands() {
  const { showToast } = useToast();

  const items: ToolbarItem[] = [
    {
      id: "refresh",
      label: "Refresh",
      onSelect: () => showToast({ title: "Refresh complete", variant: "success" }),
    },
  ];

  return <Toolbar ariaLabel="Page commands" items={items} />;
}
```

### DataGrid Bulk Action

Keep selected rows in the consuming app, then show a toast when a bulk operation completes.

```tsx
function InvoiceGrid() {
  const { showToast } = useToast();
  const [selectedRowIds, setSelectedRowIds] = useState<RowId[]>([]);

  return (
    <>
      <Toolbar
        ariaLabel="Invoice commands"
        items={[
          {
            id: "archive",
            label: "Archive selected",
            disabled: selectedRowIds.length === 0,
            onSelect: () => showToast({
              title: "Archive complete",
              description: `${selectedRowIds.length} invoices archived.`,
              variant: "success",
            }),
          },
        ]}
      />
      <DataGrid
        columns={columns}
        data={invoices}
        enableRowSelection
        onRowSelectionChange={setSelectedRowIds}
        selectedRowIds={selectedRowIds}
      />
    </>
  );
}
```

### Form Submit

Use `toastPromise` for submit flows so loading, success, and error states stay attached to one notification.

```tsx
function ProfileForm() {
  const { toastPromise } = useToast();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void toastPromise(saveProfile(), {
      loading: { title: "Saving profile", variant: "info" },
      success: { title: "Profile saved", variant: "success" },
      error: { title: "Save failed", variant: "error" },
    });
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### File Manager Operations

Use operation callbacks to show upload, download, delete, or provider errors.

```tsx
<FileManager
  items={files}
  onUpload={(uploadedFiles) => showToast({
    title: "Upload complete",
    description: `${uploadedFiles.length} files uploaded.`,
    variant: "success",
  })}
  onDelete={(items) => showToast({
    title: "Delete complete",
    description: `${items.length} items deleted.`,
    variant: "success",
  })}
/>
```

## Accessibility

`ToastViewport` renders a `role="region"` labelled `Notifications`. Info and success toasts render `role="status"` with polite live-region behavior. Warning and error toasts render `role="alert"` with assertive live-region behavior.

Each toast is labelled by its title by default and described by its description when present. Use `ariaLabel` when the visual title is not specific enough for assistive technology. Dismiss buttons include the toast name, action buttons are native buttons, focused toasts can be dismissed with `Escape`, and auto-dismiss timers pause while a toast is hovered or focused. Toast transitions include reduced-motion-safe classes.
