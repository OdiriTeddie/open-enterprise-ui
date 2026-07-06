# `@open-enterprise-ui/react`

React components for Open Enterprise UI.

This package is early-stage and currently starts with a typed `DataGrid` for data-heavy interfaces.

## Installation

```bash
pnpm add @open-enterprise-ui/react
```

## Usage

```tsx
import { DataGrid, type Column } from "@open-enterprise-ui/react";

type User = {
  id: number;
  name: string;
  role: string;
};

const columns: Column<User>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "role", header: "Role", sortable: true },
];

export function UsersTable({ users }: { users: User[] }) {
  return (
    <DataGrid
      columns={columns}
      data={users}
      getRowId={(user) => user.id}
      emptyMessage="No users found."
      defaultPagination={{ pageIndex: 0, pageSize: 10 }}
      pageSizeOptions={[10, 25, 50]}
      globalFilterPlaceholder="Search users..."
      enableRowSelection
      showPagination
      ariaLabel="Users table"
    />
  );
}
```

## DataGrid Features

- Typed column definitions.
- Accessor keys and accessor functions.
- Custom cell rendering.
- Column alignment, widths, ordering, pinning, resizing, and visibility.
- Controlled and uncontrolled filtering.
- Controlled and uncontrolled single-column and multi-column sorting.
- Controlled and uncontrolled pagination with first/previous/next/last controls.
- Client-side and server-side row pipeline modes.
- Controlled and uncontrolled row selection.
- Custom loading, empty, and no-results render slots.
- Accessible table, sorting, selection, and pagination semantics.

## Documentation

- [DataGrid API](../../docs/data-grid.md)

## Development

From the repository root:

```bash
pnpm --filter @open-enterprise-ui/react dev
pnpm --filter @open-enterprise-ui/react typecheck
pnpm --filter @open-enterprise-ui/react lint
pnpm --filter @open-enterprise-ui/react test
pnpm --filter @open-enterprise-ui/react build
```


