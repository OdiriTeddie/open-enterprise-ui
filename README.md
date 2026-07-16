# Open Enterprise UI

Open-source UI components for teams building internal tools, admin panels, dashboards, and data-heavy products.

The project currently ships a React package with enterprise-focused `DataGrid`, `TreeList`, form primitives/Form Builder, `FileManager`, `Dialog`, `Drawer`, `Tabs`, and `Navigation` components. The repo is structured so other framework packages, such as Vue, can be added later without renaming or reshaping the project again.

## Packages

| Package | Status | Description |
| --- | --- | --- |
| `@open-enterprise-ui/react` | Early development | React components including `DataGrid`, `TreeList`, forms, `FileManager`, `Dialog`, `Drawer`, `Tabs`, and `Navigation`. |
| `@open-enterprise-ui/vue` | Planned | Vue components. |

## Goals

- TypeScript-first component APIs.
- Practical defaults for enterprise applications.
- Composable components instead of locked-in page templates.
- Accessible, predictable markup.
- Framework packages that can share design direction over time.
- Small, focused components that can be adopted one at a time.

## Installation

```bash
pnpm add @open-enterprise-ui/react
```

React is a peer dependency, so your app should already provide `react` and `react-dom`.

## Components

- `DataGrid`: typed columns, sorting, filtering, pagination, selection, column resizing, server-side hooks, and row virtualization.
- `TreeList`: hierarchical rows with typed columns, controlled/uncontrolled expansion, and accessible treegrid semantics.
- `Form` / `FormBuilder`: accessible form layout, schema-driven forms, validation, async options, dirty state, and server error mapping.
- `FileManager`: provider-backed folder browsing, context menus, rename/move/copy/upload flows, details panel, permissions, keyboard accessibility, and virtualization.
- `Dialog`: controlled modal surface with accessible labelling, focus management, Escape/backdrop close, and action slots.
- `Drawer`: controlled edge panel for contextual workflows, details views, filters, and secondary forms.
- `Tabs`: accessible tabbed navigation with controlled/uncontrolled state, disabled tabs, orientation support, and keyboard navigation.
- `Navigation`: side or top navigation with groups, links, badges, active state, and keyboard movement.

## Usage

```tsx
import { DataGrid, type Column } from "@open-enterprise-ui/react";

type User = {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Invited";
};

const columns: Column<User>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "role", header: "Role", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: ({ value }) => <strong>{String(value)}</strong>,
  },
];

export function UsersTable({ users }: { users: User[] }) {
  return (
    <DataGrid
      columns={columns}
      data={users}
      emptyMessage="No users found."
      getRowId={(user) => user.id}
      defaultPagination={{ pageIndex: 0, pageSize: 10 }}
      pageSizeOptions={[10, 25, 50]}
      globalFilterPlaceholder="Search users..."
      enableRowSelection
      showPagination
      enableColumnResizing
      enableColumnVisibility
      renderEmpty={() => <span>No users yet.</span>}
      ariaLabel="Users table"
    />
  );
}
```

## Documentation

- [DataGrid API](./docs/data-grid.md)
- [TreeList API](./docs/tree-list.md)
- [Form API](./docs/form.md)
- [File Manager API](./docs/file-manager.md)
- [Dialog API](./docs/dialog.md)
- [Drawer API](./docs/drawer.md)
- [Tabs API](./docs/tabs.md)
- [Navigation API](./docs/navigation.md)

## Repository Structure

```text
packages/
  react/
    src/
    package.json
```

- `packages/react` contains the current React package and local Vite playground.
- Future framework packages should live under `packages/*`.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the React playground:

```bash
pnpm dev
```

Run checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

You can also run commands directly against the React package:

```bash
pnpm --filter @open-enterprise-ui/react dev
```

## Roadmap

- Continue hardening DataGrid, TreeList, Form, FileManager, and overlay APIs with accessibility and integration tests.
- Add command surfaces, dashboards, and additional data-display components.
- Expand server-side examples and production usage recipes.
- Shared foundations for future framework packages.

## Contributing

Contributions are welcome. Before opening a pull request, run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

For larger changes, open an issue first so the API direction can be discussed.

## License

MIT


