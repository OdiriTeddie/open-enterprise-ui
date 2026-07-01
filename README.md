# Open Enterprise UI

Open-source UI components for teams building internal tools, admin panels, dashboards, and data-heavy products.

The project currently starts with the React package and a typed `DataGrid`. The repo is structured so other framework packages, such as Vue, can be added later without renaming or reshaping the project again.

## Packages

| Package | Status | Description |
| --- | --- | --- |
| `@open-enterprise-ui/react` | Early development | React components, starting with `DataGrid`. |
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
    />
  );
}
```

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
pnpm build
```

You can also run commands directly against the React package:

```bash
pnpm --filter @open-enterprise-ui/react dev
```

## Roadmap

- DataGrid pagination, filtering, selection, and column resizing.
- Form controls for enterprise workflows.
- Navigation, tabs, modals, and command surfaces.
- Dashboard and data-display components.
- Stronger accessibility coverage and interaction tests.
- Shared foundations for future framework packages.

## Contributing

Contributions are welcome. Before opening a pull request, run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

For larger changes, open an issue first so the API direction can be discussed.

## License

MIT
