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
  { accessorKey: "name", header: "Name", width: 280 },
  { accessorKey: "role", header: "Role" },
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
- Typed columns and custom cell rendering.
- Empty state rendering.

Sorting, filtering, lazy loading, and virtualization are planned follow-up phases.
