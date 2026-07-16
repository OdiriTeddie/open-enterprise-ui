# Tabs

`Tabs` renders an accessible tab list and tab panels for switching between related views in dashboards, settings pages, forms, and detail screens.

## Import

```tsx
import { Tabs } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
<Tabs
  items={[
    {
      label: "Overview",
      value: "overview",
      content: <OverviewPanel />,
    },
    {
      label: "Members",
      value: "members",
      content: <MembersPanel />,
    },
  ]}
/>
```

## Controlled State

```tsx
<Tabs
  value={activeTab}
  onValueChange={setActiveTab}
  items={items}
/>
```

Use `defaultValue` for uncontrolled initial state.

## Keyboard Behavior

- `ArrowRight` / `ArrowLeft` move through horizontal tabs.
- `ArrowDown` / `ArrowUp` move through vertical tabs.
- `Home` moves to the first enabled tab.
- `End` moves to the last enabled tab.
- Disabled tabs are skipped.
- In `activationMode="automatic"`, focus movement selects the tab.
- In `activationMode="manual"`, use `Enter` or `Space` to select the focused tab.

## Props

| Prop | Description |
| --- | --- |
| `items` | Array of tab definitions with `label`, `value`, `content`, optional `id`, and optional `disabled`. |
| `value` | Controlled active tab value. |
| `defaultValue` | Initial active tab value for uncontrolled usage. |
| `onValueChange` | Called when a tab is selected. |
| `orientation` | `horizontal` or `vertical`. Defaults to `horizontal`. |
| `activationMode` | `automatic` or `manual`. Defaults to `automatic`. |
| `ariaLabel` | Accessible label for the tab list. Defaults to `Tabs`. |
| `className` | Optional class names for the root element. |
