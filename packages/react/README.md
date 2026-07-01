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
    />
  );
}
```

## Development

From the repository root:

```bash
pnpm --filter @open-enterprise-ui/react dev
pnpm --filter @open-enterprise-ui/react typecheck
pnpm --filter @open-enterprise-ui/react lint
pnpm --filter @open-enterprise-ui/react build
```
