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
| `getParentId` | `(row: T) => string \| number \| null \| undefined` | Returns the parent row id. Missing or unknown parents are treated as root rows. |
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

`TreeList` renders a `treegrid` with row `aria-level` and `aria-expanded` state. Expand/collapse controls are real buttons with accessible labels.

## Current Scope

Phase 1 includes:

- Flat data to hierarchical rows.
- Expand/collapse controls.
- Controlled and uncontrolled expanded state.
- Single and multiple row selection.
- Optional cascading parent/child selection.
- Sibling sorting with controlled and uncontrolled sort state.
- Global filtering with hierarchy-aware filter modes.
- Typed columns and custom cell rendering.
- Empty state rendering.

Lazy loading and virtualization are planned follow-up phases.
