# Dialog

`Dialog` renders a controlled modal surface for focused workflows, confirmations, and short forms.

## Import

```tsx
import { Dialog } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Delete project"
  description="This action cannot be undone."
  actions={(
    <>
      <button type="button" onClick={() => setOpen(false)}>Cancel</button>
      <button type="button" onClick={deleteProject}>Delete</button>
    </>
  )}
>
  Review the project details before deleting it.
</Dialog>
```

## Behavior

- Controlled with `open` and `onOpenChange`.
- Uses `role="dialog"` and `aria-modal="true"`.
- Focus moves into the dialog when opened and returns to the previous element when closed.
- `Tab` and `Shift+Tab` cycle through focusable controls inside the dialog.
- `Escape` closes the dialog by default.
- Backdrop click closes the dialog by default.

## Props

| Prop | Description |
| --- | --- |
| `open` | Controls whether the dialog is rendered. |
| `onOpenChange` | Called with `false` when the dialog requests to close. |
| `title` | Optional accessible title rendered in the header. |
| `description` | Optional supporting text connected with `aria-describedby`. |
| `children` | Main dialog body content. |
| `actions` | Optional footer actions. |
| `size` | `sm`, `md`, `lg`, or `xl`. Defaults to `md`. |
| `closeOnEscape` | Enables or disables Escape close behavior. Defaults to `true`. |
| `closeOnBackdropClick` | Enables or disables backdrop click close behavior. Defaults to `true`. |
| `initialFocusRef` | Optional element ref to focus when the dialog opens. |
| `labelledById` | Optional custom ID for the accessible title. |
