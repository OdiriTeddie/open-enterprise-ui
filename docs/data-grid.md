# DataGrid

`DataGrid` is the first React component in Open Enterprise UI. It is designed for data-heavy interfaces where teams need typed columns, predictable state, and practical table behavior without adopting a full application framework.

## Import

```tsx
import {
  DataGrid,
  type Column,
  type ColumnOrderState,
  type DataGridMode,
  type FilterState,
  type PaginationState,
  type RowId,
  type SortState,
} from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
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
      ariaLabel="Users table"
      columns={columns}
      data={users}
      getRowId={(user) => user.id}
      emptyMessage="No users found."
    />
  );
}
```

## Data Pipeline

By default, rows are processed in client mode in this order:

```text
data -> filteredData -> sortedData -> paginatedData
```

This keeps behavior predictable when features are combined. For example, filtering resets pagination to the first page, sorting runs after filtering, and pagination only slices the final sorted result.

Use `mode="server"` when the consuming app owns filtering, sorting, pagination, and remote data loading. In server mode, DataGrid renders the `data` array exactly as provided while still emitting `onFilterChange`, `onSortChange`, and `onPaginationChange`.


## Server-Side Mode

```tsx
const [sort, setSort] = useState<SortState | null>(null);
const [filter, setFilter] = useState<FilterState>({ global: "" });
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});

<DataGrid
  columns={columns}
  data={usersPage}
  mode="server"
  rowCount={totalUsers}
  sort={sort}
  onSortChange={setSort}
  filter={filter}
  onFilterChange={setFilter}
  pagination={pagination}
  onPaginationChange={setPagination}
/>;
```

Server mode skips internal filtering, sorting, and pagination. Use the controlled state callbacks to update your query parameters, fetch the next page of rows, and pass the current page back through `data`. `rowCount` represents the total number of rows on the server and is used for page counts and range text.

## Column API

```tsx
const columns: Column<User>[] = [
  {
    id: "displayName",
    accessorFn: (user) => `${user.name} (${user.role})`,
    header: "User",
    sortable: true,
    filterable: true,
    align: "left",
    width: 240,
    cell: ({ value }) => <span>{String(value)}</span>,
  },
];
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable column id. Recommended when using `accessorFn`. |
| `accessorKey` | `keyof T` | Reads a value directly from the row. |
| `accessorFn` | `(row: T) => TValue` | Derives a value from the row. |
| `key` | `keyof T \| string` | Legacy alias for simple field access. |
| `header` | `ReactNode` | Header content. |
| `cell` | `(context: CellContext<T, TValue>) => ReactNode` | Custom cell renderer with row, value, rowIndex, and column. |
| `render` | `(row: T) => ReactNode` | Legacy row-only custom renderer. |
| `align` | `"left" \| "center" \| "right"` | Header and cell alignment. |
| `width` | `number \| string` | Column width. Numbers are treated as pixels. |
| `sortable` | `boolean` | Enables sort cycling for the column. |
| `sortAccessor` | `(row: T) => string \| number \| Date \| null \| undefined` | Custom value used for sorting. |
| `filterable` | `boolean` | Set to `false` to exclude a column from global filtering. |
| `filterAccessor` | `(row: T) => string \| number \| boolean \| Date \| null \| undefined` | Custom value used for global filtering. |

## Sorting

Uncontrolled sorting:

```tsx
<DataGrid
  columns={columns}
  data={users}
  defaultSort={{ columnId: "name", direction: "asc" }}
/>
```

Controlled sorting:

```tsx
const [sort, setSort] = useState<SortState | null>(null);

<DataGrid
  columns={columns}
  data={users}
  sort={sort}
  onSortChange={setSort}
/>;
```

## Filtering

Global filtering is enabled by default. It searches across columns unless a column sets `filterable: false`.

```tsx
<DataGrid
  columns={columns}
  data={users}
  globalFilterPlaceholder="Search users..."
/>
```

Controlled filtering:

```tsx
const [filter, setFilter] = useState<FilterState>({ global: "" });

<DataGrid
  columns={columns}
  data={users}
  filter={filter}
  onFilterChange={setFilter}
/>;
```

Disable the built-in global search input:

```tsx
<DataGrid columns={columns} data={users} showGlobalFilter={false} />
```

## Pagination

```tsx
<DataGrid
  columns={columns}
  data={users}
  defaultPagination={{ pageIndex: 0, pageSize: 10 }}
  pageSizeOptions={[10, 25, 50]}
/>
```

Controlled pagination:

```tsx
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});

<DataGrid
  columns={columns}
  data={users}
  pagination={pagination}
  onPaginationChange={setPagination}
/>;
```

The pagination footer includes row range text, page text, and first/previous/next/last controls. It hides automatically when the data fits on one page and there is only one page-size option.

## Column Ordering

Use `columnOrder` to render columns by id. Any columns not listed in the order are appended in their original definition order, which keeps newly added columns visible by default.

```tsx
const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
  "status",
  "name",
  "role",
]);

<DataGrid
  columns={columns}
  data={users}
  columnOrder={columnOrder}
/>
```

`defaultColumnOrder` can be used when the grid owns the initial order. Use `columnOrder` when the order is controlled by your own toolbar, settings panel, or persisted user preferences.

## Column Visibility

Column visibility can be configured up front or controlled externally. The built-in visibility controls are enabled with `enableColumnVisibility`.

```tsx
const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
  role: false,
});

<DataGrid
  columns={columns}
  data={users}
  enableColumnVisibility
  columnVisibility={columnVisibility}
  onColumnVisibilityChange={setColumnVisibility}
/>;
```

Hidden columns are not rendered in the header or body, but the original column definitions remain available for state keyed by column id.

## Column Resizing

Enable column resizing to render resize handles on column headers. Widths are stored by column id.

```tsx
const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
  name: 240,
});

<DataGrid
  columns={columns}
  data={users}
  enableColumnResizing
  columnSizing={columnSizing}
  onColumnSizingChange={setColumnSizing}
  minColumnWidth={80}
/>;
```

Column sizing falls back to `column.width` when no sizing state exists for a column. Resize handles support pointer dragging and keyboard resizing with `ArrowLeft` and `ArrowRight`.

## Row Selection

```tsx
<DataGrid
  columns={columns}
  data={users}
  getRowId={(user) => user.id}
  enableRowSelection
/>
```

Controlled row selection:

```tsx
const [selectedRowIds, setSelectedRowIds] = useState<RowId[]>([]);

<DataGrid
  columns={columns}
  data={users}
  getRowId={(user) => user.id}
  enableRowSelection
  selectedRowIds={selectedRowIds}
  onRowSelectionChange={setSelectedRowIds}
/>;
```

Use `getRowId` for stable selection across sorting, filtering, and pagination.

## Render Slots

```tsx
<DataGrid
  columns={columns}
  data={users}
  loading={isLoading}
  renderLoading={() => <span>Loading users...</span>}
  renderEmpty={() => <span>No users yet.</span>}
  renderNoResults={() => <span>No users matched your search.</span>}
/>
```

`emptyMessage` is still supported as a simple fallback for empty data.

## Accessibility

DataGrid includes:

- `ariaLabel` for naming the table.
- `aria-sort` on sortable column headers.
- Descriptive sort button labels.
- `role="status"` and `aria-live` for loading, empty, and no-results states.
- A `Pagination` navigation landmark.
- Accessible labels for row selection and pagination controls.
- Mixed state support for the select-all-visible checkbox.

```tsx
<DataGrid ariaLabel="Users table" columns={columns} data={users} />
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `columns` | `Column<T>[]` | Column definitions. |
| `data` | `T[]` | Source rows. In server mode, this should be the current page of rows. |
| `mode` | `"client" \| "server"` | Chooses whether DataGrid transforms rows internally or renders server-provided rows as-is. |
| `rowCount` | `number` | Total server row count used for pagination metadata in server mode. |
| `loading` | `boolean` | Shows the loading state. |
| `emptyMessage` | `string` | Fallback empty message. |
| `renderLoading` | `() => ReactNode` | Custom loading state. |
| `renderEmpty` | `() => ReactNode` | Custom empty-data state. |
| `renderNoResults` | `() => ReactNode` | Custom no-filter-results state. |
| `getRowId` | `(row: T, index: number) => RowId` | Stable row id resolver. |
| `defaultSort` | `SortState \| null` | Initial uncontrolled sort. |
| `sort` | `SortState \| null` | Controlled sort. |
| `onSortChange` | `(sort: SortState \| null) => void` | Sort change callback. |
| `defaultPagination` | `PaginationState` | Initial uncontrolled pagination. |
| `pagination` | `PaginationState` | Controlled pagination. |
| `onPaginationChange` | `(pagination: PaginationState) => void` | Pagination change callback. |
| `pageSizeOptions` | `number[]` | Page size options. |
| `showPagination` | `boolean` | Shows or hides pagination. |
| `defaultFilter` | `FilterState` | Initial uncontrolled filter. |
| `filter` | `FilterState` | Controlled filter. |
| `onFilterChange` | `(filter: FilterState) => void` | Filter change callback. |
| `showGlobalFilter` | `boolean` | Shows or hides the built-in global search input. |
| `globalFilterPlaceholder` | `string` | Placeholder for the global search input. |
| `enableRowSelection` | `boolean` | Adds row selection controls. |
| `defaultSelectedRowIds` | `RowId[]` | Initial uncontrolled selected row ids. |
| `selectedRowIds` | `RowId[]` | Controlled selected row ids. |
| `onRowSelectionChange` | `(selectedRowIds: RowId[]) => void` | Selection change callback. |
| `ariaLabel` | `string` | Accessible table label. |
| `enableColumnResizing` | `boolean` | Adds resize handles to column headers. |
| `defaultColumnOrder` | `ColumnOrderState` | Initial uncontrolled column order. |
| `columnOrder` | `ColumnOrderState` | Controlled column order. Missing columns are appended automatically. |
| `enableColumnVisibility` | `boolean` | Shows built-in column visibility controls. |
| `defaultColumnVisibility` | `ColumnVisibilityState` | Initial uncontrolled column visibility. |
| `columnVisibility` | `ColumnVisibilityState` | Controlled column visibility. |
| `onColumnVisibilityChange` | `(columnVisibility: ColumnVisibilityState) => void` | Column visibility change callback. |
| `defaultColumnSizing` | `ColumnSizingState` | Initial uncontrolled column widths. |
| `columnSizing` | `ColumnSizingState` | Controlled column widths. |
| `onColumnSizingChange` | `(columnSizing: ColumnSizingState) => void` | Column sizing change callback. |
| `minColumnWidth` | `number` | Minimum column width in pixels. |

## State Types

```ts
type DataGridMode = "client" | "server";

type SortState = {
  columnId: string;
  direction: "asc" | "desc";
};

type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

type FilterState = {
  global: string;
};

type RowId = string | number;

type ColumnSizingState = Record<string, number>;

type ColumnOrderState = string[];

type ColumnVisibilityState = Record<string, boolean>;
```

## Testing

Run the React package checks from the repository root:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```


