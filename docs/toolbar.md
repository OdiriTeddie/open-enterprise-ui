# Toolbar API

`Toolbar` renders a compact command surface for enterprise workflows such as file actions, grid commands, filters, and contextual page actions.

## Import

```tsx
import { Toolbar, type ToolbarItem } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
const items: ToolbarItem[] = [
  { id: "new", label: "New", variant: "primary", onSelect: createItem },
  { id: "upload", label: "Upload", onSelect: uploadFiles },
  { id: "separator", type: "separator" },
  { id: "filters", label: "Filters", pressed: true },
  { id: "delete", label: "Delete", variant: "danger", disabled: true },
];

<Toolbar ariaLabel="File commands" items={items} />;
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `ToolbarItem[]` | Action and separator items. |
| `ariaLabel` | `string` | Accessible toolbar label. Defaults to `"Toolbar"`. |
| `orientation` | `"horizontal" \| "vertical"` | Toolbar orientation. Defaults to `"horizontal"`. |
| `size` | `"sm" \| "md"` | Button density. Defaults to `"md"`. |
| `leading` | `ReactNode` | Optional content before toolbar items. |
| `trailing` | `ReactNode` | Optional content after toolbar items. |
| `className` | `string` | Additional class names for the root toolbar. |

## Items

```ts
type ToolbarActionItem = {
  id: string;
  type?: "action";
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "subtle";
  pressed?: boolean;
  tooltip?: string;
  onSelect?: () => void;
};

type ToolbarSeparatorItem = {
  id: string;
  type: "separator";
};
```

## Accessibility

`Toolbar` renders `role="toolbar"` with `aria-orientation`. Separators render `role="separator"`. Pressed action items expose `aria-pressed`.

Keyboard behavior:

- `ArrowRight` / `ArrowLeft` move focus in horizontal toolbars.
- `ArrowDown` / `ArrowUp` move focus in vertical toolbars.
- `Home` moves focus to the first enabled action.
- `End` moves focus to the last enabled action.
- `Enter` and `Space` activate the focused action.
- Disabled actions and separators are skipped.

Menus and overflow handling are planned follow-up phases.
