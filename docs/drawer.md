# Drawer

`Drawer` renders a controlled side or edge panel for contextual workflows, details views, filters, and secondary forms.

## Import

```tsx
import { Drawer } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
const [open, setOpen] = useState(false);

<Drawer
  open={open}
  onOpenChange={setOpen}
  side="right"
  title="Edit filters"
  description="Adjust the current report filters."
  actions={(
    <>
      <button type="button" onClick={() => setOpen(false)}>Cancel</button>
      <button type="button" onClick={applyFilters}>Apply</button>
    </>
  )}
>
  Filter controls go here.
</Drawer>
```

## Behavior

- Controlled with `open` and `onOpenChange`.
- Uses `role="dialog"` and `aria-modal="true"`.
- Supports `side="left" | "right" | "top" | "bottom"`.
- Focus moves into the drawer when opened and returns to the previous element when closed.
- `Tab` and `Shift+Tab` cycle through focusable controls inside the drawer.
- `Escape` closes the drawer by default.
- Backdrop click closes the drawer by default.

## Props

| Prop | Description |
| --- | --- |
| `open` | Controls whether the drawer is rendered. |
| `onOpenChange` | Called with `false` when the drawer requests to close. |
| `side` | `left`, `right`, `top`, or `bottom`. Defaults to `right`. |
| `size` | `sm`, `md`, `lg`, or `xl`. Defaults to `md`. |
| `title` | Optional accessible title rendered in the header. |
| `description` | Optional supporting text connected with `aria-describedby`. |
| `children` | Main drawer body content. |
| `actions` | Optional footer actions. |
| `closeOnEscape` | Enables or disables Escape close behavior. Defaults to `true`. |
| `closeOnBackdropClick` | Enables or disables backdrop click close behavior. Defaults to `true`. |
| `initialFocusRef` | Optional element ref to focus when the drawer opens. |
| `labelledById` | Optional custom ID for the accessible title. |
