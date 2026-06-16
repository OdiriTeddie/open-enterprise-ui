# React UI Kit

Enterprise-ready React components for teams building internal tools, admin panels, dashboards, and data-heavy products.

The project is starting with a typed `DataGrid` component and will grow into a broader set of reusable UI primitives and composed business components.

## Status

This package is early-stage. The public API may change while the first components are being shaped.

## Goals

- TypeScript-first React components.
- Practical defaults for enterprise applications.
- Composable APIs instead of locked-in page templates.
- Accessible, predictable markup.
- Styling that works well with Tailwind CSS.
- Small, focused components that can be adopted one at a time.

## Installation

```bash
pnpm add react-ui-kit
```

React is a peer dependency, so your app should already provide `react` and `react-dom`.

## Usage

```tsx
import { DataGrid, type Column } from "react-ui-kit";

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

const users: User[] = [
  { id: 1, name: "Ada Lovelace", role: "Engineer", status: "Active" },
  { id: 2, name: "Grace Hopper", role: "Admin", status: "Invited" },
];

export function UsersTable() {
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

## DataGrid API

### `DataGrid<T>`

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `columns` | `Column<T>[]` | Yes | Column definitions for the table. |
| `data` | `T[]` | Yes | Rows rendered by the grid. |
| `loading` | `boolean` | No | Displays a loading state when true. |
| `emptyMessage` | `string` | No | Message shown when `data` is empty. |
| `getRowId` | `(row: T, index: number) => string \| number` | No | Returns a stable key for each row. |
| `defaultSort` | `SortState \| null` | No | Initial uncontrolled sort state. |
| `sort` | `SortState \| null` | No | Controlled sort state. |
| `onSortChange` | `(sort: SortState \| null) => void` | No | Called when a sortable header changes sort state. |

### `Column<T>`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | No | Stable column id. Useful when using `accessorFn`. |
| `accessorKey` | `keyof T` | No | Field used to read the row value. |
| `accessorFn` | `(row: T) => TValue` | No | Function used to derive the cell value. |
| `key` | `keyof T \| string` | No | Legacy alias for simple field access. |
| `header` | `ReactNode` | Yes | Content rendered in the column header. |
| `cell` | `(context: CellContext<T, TValue>) => ReactNode` | No | Custom cell renderer with access to row, value, row index, and column. |
| `render` | `(row: T) => ReactNode` | No | Legacy custom cell renderer. |
| `align` | `"left" \| "center" \| "right"` | No | Horizontal alignment for header and cells. |
| `width` | `number \| string` | No | Column width. Numbers are treated as pixels. |
| `sortable` | `boolean` | No | Enables header click sorting for the column. |
| `sortAccessor` | `(row: T) => string \| number \| Date \| null \| undefined` | No | Custom value used for sorting. |

### Sorting

Mark a column as sortable to enable built-in client-side sorting:

```tsx
const columns: Column<User>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    sortAccessor: (user) => user.status,
  },
];
```

For controlled sorting, pass `sort` and `onSortChange`:

```tsx
const [sort, setSort] = useState<SortState | null>(null);

<DataGrid
  columns={columns}
  data={users}
  sort={sort}
  onSortChange={setSort}
/>;
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the playground app:

```bash
pnpm dev
```

Type-check the app:

```bash
pnpm typecheck
```

Run lint:

```bash
pnpm lint
```

Build the package:

```bash
pnpm build
```

## Project Structure

```text
src/
  components/
    data-grid/
      DataGrid.tsx
      index.tsx
  index.ts
```

- `src/index.ts` is the library entrypoint.
- `src/components/**` contains reusable package components.
- `src/App.tsx` is only the local playground/demo surface.

## Roadmap

- DataGrid sorting, selection, pagination, and column alignment.
- Form controls for enterprise workflows.
- Navigation, tabs, modals, and command surfaces.
- Dashboard and data-display components.
- Stronger accessibility coverage and interaction tests.

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
