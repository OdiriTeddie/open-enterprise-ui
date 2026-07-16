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
  {
    id: "view",
    type: "menu",
    label: "View",
    items: [
      { id: "list", label: "List view", selected: true },
      { id: "grid", label: "Grid view", onSelect: setGridView },
    ],
  },
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

type ToolbarMenuOption = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

type ToolbarMenuItem = {
  id: string;
  type: "menu";
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "subtle";
  tooltip?: string;
  items: ToolbarMenuOption[];
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
- `Enter` and `Space` activate the focused action or open a focused menu.
- `ArrowDown` opens a focused menu and focuses the first option.
- `ArrowUp` opens a focused menu and focuses the last option.
- Open menus use `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`, `Space`, and `Escape`.
- Disabled actions, disabled menu options, and separators are skipped.
- Outside clicks close open menus.

Overflow handling is planned as a follow-up phase.
