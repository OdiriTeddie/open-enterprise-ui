# Navigation

`Navigation` renders accessible side or top navigation for application shells, settings pages, dashboards, and admin tools.

## Import

```tsx
import { Navigation } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
<Navigation
  items={[
    { label: "Overview", value: "overview" },
    { label: "Reports", value: "reports", badge: "4" },
    { label: "Settings", value: "settings" },
  ]}
/>
```

## Groups

```tsx
<Navigation
  items={[
    {
      label: "Workspace",
      items: [
        { label: "Overview", value: "overview" },
        { label: "Tasks", value: "tasks" },
      ],
    },
    {
      label: "Admin",
      items: [
        { label: "Members", value: "members" },
        { label: "Billing", value: "billing", disabled: true },
      ],
    },
  ]}
/>
```

## Controlled State

```tsx
<Navigation
  value={activePage}
  onValueChange={(value, item) => setActivePage(value)}
  items={items}
/>
```

Use `defaultValue` for uncontrolled initial state.

## Keyboard Behavior

- Vertical navigation uses `ArrowDown` and `ArrowUp`.
- Horizontal navigation uses `ArrowRight` and `ArrowLeft`.
- `Home` moves to the first enabled item.
- `End` moves to the last enabled item.
- Disabled items are skipped.
- `Enter` and `Space` select the focused item.

## Props

| Prop | Description |
| --- | --- |
| `items` | Array of navigation items or groups. |
| `value` | Controlled active item value. |
| `defaultValue` | Initial active value for uncontrolled usage. |
| `onValueChange` | Called with the selected value and item. |
| `orientation` | `vertical` or `horizontal`. Defaults to `vertical`. |
| `ariaLabel` | Accessible label for the `nav`. Defaults to `Navigation`. |
| `className` | Optional root class names. |

## Item API

| Field | Description |
| --- | --- |
| `label` | Item label. |
| `value` | Unique item value. |
| `href` | Optional link URL. Items without `href` render as buttons. |
| `icon` | Optional decorative icon slot. |
| `badge` | Optional trailing badge. |
| `disabled` | Disables the item. |
