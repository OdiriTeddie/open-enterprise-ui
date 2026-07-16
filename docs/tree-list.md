# TreeList API

`TreeList` renders hierarchical data in a table-like treegrid. It is intended for org charts, category trees, folder-like data, permissions, and nested operational records.

## Import

```tsx
import { TreeList, type TreeListColumn } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
type Employee = {
  id: string;
  managerId?: string;
  name: string;
  role: string;
};

const columns: TreeListColumn<Employee>[] = [
  { accessorKey: "name", header: "Name", sortable: true, width: 280 },
  { accessorKey: "role", header: "Role", sortable: true },
];

export function EmployeeTree({ employees }: { employees: Employee[] }) {
  return (
    <TreeList
      ariaLabel="Employee hierarchy"
      columns={columns}
      data={employees}
      defaultExpandedRowIds={["ceo"]}
      selectionMode="multiple"
      enableCascadeSelection
      getParentId={(employee) => employee.managerId}
      getRowId={(employee) => employee.id}
    />
  );
}
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `columns` | `TreeListColumn<T>[]` | Column definitions. |
| `data` | `T[]` | Flat row data. Parent/child relationships are derived with `getParentId`. |
| `getRowId` | `(row: T, index: number) => string \| number` | Returns the stable row id. |
| `isRowExpandable` | `(row: T) => boolean` | Marks rows as expandable even before children are present. Useful for server/lazy loading. |
| `loadChildren` | `(row: T) => T[] \| Promise<T[]>` | Loads child rows when an expandable row is opened. Loaded rows are merged into the local tree. |
| `loadingRowIds` | `TreeListRowId[]` | Controlled loading state for rows. If omitted, `TreeList` manages loading state for `loadChildren`. |
| `renderLoadingRow` | `(row: T) => ReactNode` | Custom loading content shown below an expanded loading row. |
| `onRowExpand` | `(row: T) => void` | Called when a row is expanded. |
| `onRowCollapse` | `(row: T) => void` | Called when a row is collapsed. |
| `onError` | `(error: unknown) => void` | Called when `loadChildren` rejects. |
| `errorMessage` | `string` | Error text rendered when lazy loading fails. |
| `getParentId` | `(row: T) => string \| number \| null \| undefined` | Returns the parent row id. Missing or unknown parents are treated as root rows. |
| `defaultColumnOrder` | `string[]` | Initial column order for uncontrolled ordering. |
| `columnOrder` | `string[]` | Controlled column order. |
| `defaultColumnVisibility` | `Record<string, boolean>` | Initial column visibility map. Set a column id to `false` to hide it. |
| `columnVisibility` | `Record<string, boolean>` | Controlled column visibility map. |
| `defaultColumnPinning` | `{ left: string[]; right: string[] }` | Initial pinned column ids. |
| `columnPinning` | `{ left: string[]; right: string[] }` | Controlled pinned column ids. |
| `defaultColumnSizing` | `Record<string, number>` | Initial column widths in pixels. |
| `columnSizing` | `Record<string, number>` | Controlled column widths in pixels. |
| `onColumnSizingChange` | `(sizing: Record<string, number>) => void` | Called when keyboard resizing changes a column width. |
| `enableColumnResizing` | `boolean` | Shows keyboard-accessible resize handles in column headers. |
| `minColumnWidth` | `number` | Minimum column width used by resizing. |
| `defaultExpandedRowIds` | `TreeListRowId[]` | Initial expanded row ids for uncontrolled expansion. |
| `defaultSort` | `TreeListSortState \| null` | Initial sort state for uncontrolled sorting. Sorting is applied to sibling rows. |
| `sort` | `TreeListSortState \| null` | Controlled sort state. |
| `onSortChange` | `(sort: TreeListSortState \| null) => void` | Called when a sortable column header is toggled. |
| `defaultFilter` | `TreeListFilterState` | Initial global filter for uncontrolled filtering. |
| `filter` | `TreeListFilterState` | Controlled global filter. |
| `onFilterChange` | `(filter: TreeListFilterState) => void` | Called when the global filter changes. |
| `filterMode` | `"match-only" \| "include-ancestors" \| "include-descendants"` | Controls how hierarchy is preserved while filtering. Defaults to `"include-ancestors"`. |
| `showGlobalFilter` | `boolean` | Shows or hides the built-in global search field. |
| `globalFilterPlaceholder` | `string` | Placeholder text for the global search field. |
| `selectionMode` | `"none" \| "single" \| "multiple"` | Enables row selection. Defaults to `"none"`. |
| `defaultSelectedRowIds` | `TreeListRowId[]` | Initial selected row ids for uncontrolled selection. |
| `selectedRowIds` | `TreeListRowId[]` | Controlled selected row ids. |
| `onSelectedRowIdsChange` | `(ids: TreeListRowId[]) => void` | Called when row selection changes. |
| `enableCascadeSelection` | `boolean` | When `true`, selecting a parent in multiple selection mode also selects descendants and shows indeterminate parent state. |
| `expandedRowIds` | `TreeListRowId[]` | Controlled expanded row ids. |
| `onExpandedRowIdsChange` | `(ids: TreeListRowId[]) => void` | Called when a row is expanded or collapsed. |
| `emptyMessage` | `string` | Empty state text. |
| `renderEmpty` | `() => ReactNode` | Custom empty state render slot. |
| `ariaLabel` | `string` | Accessible label for the treegrid. |

## Columns

```ts
type TreeListColumn<T, TValue = unknown> = {
  id?: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => TValue;
  key?: keyof T | string;
  header: ReactNode;
  cell?: (context: TreeListCellContext<T, TValue>) => ReactNode;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  filterable?: boolean;
  filterAccessor?: (row: T) => string | number | boolean | Date | null | undefined;
  align?: "left" | "center" | "right";
  width?: number | string;
};
```

The first column is the tree column. It receives indentation and the expand/collapse control when a row has children.

## Accessibility

`TreeList` renders a `treegrid` with row `aria-level`, `aria-expanded`, and `aria-selected` state where applicable. Expand/collapse and resize controls are real buttons with row- or column-specific accessible labels. Sortable headers expose `aria-sort`.

Keyboard behavior:

- `ArrowDown` and `ArrowUp` move focus between visible rows.
- `Home` and `End` move focus to the first or last visible row.
- `ArrowRight` expands a focused expandable row.
- `ArrowLeft` collapses a focused expanded row.
- `Space` or `Enter` toggles selection when selection is enabled.
- Column resize handles support `ArrowLeft` and `ArrowRight`.

## Current Scope

Phase 1 includes:

- Flat data to hierarchical rows.
- Expand/collapse controls.
- Controlled and uncontrolled expanded state.
- Single and multiple row selection.
- Optional cascading parent/child selection.
- Sibling sorting with controlled and uncontrolled sort state.
- Global filtering with hierarchy-aware filter modes.
- Lazy child loading with row-level loading and error hooks.
- Column ordering, visibility, pinning, sizing, and keyboard resizing.
- Treegrid keyboard navigation and selection shortcuts.
- Typed columns and custom cell rendering.
- Empty state rendering.

Virtualization is planned as a follow-up phase.


## Lazy Loading

Use `isRowExpandable` when the server knows a row can have children before they are loaded. `loadChildren` runs the first time an expandable row without local children is opened.

```tsx
<TreeList
  columns={columns}
  data={departments}
  getRowId={(department) => department.id}
  getParentId={(department) => department.parentId}
  isRowExpandable={(department) => department.hasChildren}
  loadChildren={(department) => fetchDepartmentChildren(department.id)}
  renderLoadingRow={(department) => <span>Loading {department.name}...</span>}
/>
```
