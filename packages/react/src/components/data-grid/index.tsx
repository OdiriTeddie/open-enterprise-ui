import { DataGrid } from "./DataGrid";
import type { Column } from "./types";

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
    cell: ({ value }) => (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        {String(value)}
      </span>
    ),
  },
];

const users: User[] = [
  { id: 1, name: "Ada Lovelace", role: "Engineer", status: "Active" },
  { id: 2, name: "Grace Hopper", role: "Admin", status: "Invited" },
  { id: 3, name: "Katherine Johnson", role: "Analyst", status: "Active" },
  { id: 4, name: "Mary Jackson", role: "Engineer", status: "Active" },
  { id: 5, name: "Dorothy Vaughan", role: "Admin", status: "Invited" },
  { id: 6, name: "Annie Easley", role: "Engineer", status: "Active" },
];

export function DataGridExample() {
  return (
    <DataGrid
      columns={columns}
      data={users}
      emptyMessage="No users found."
      getRowId={(user) => user.id}
      defaultPagination={{ pageIndex: 0, pageSize: 5 }}
      pageSizeOptions={[5, 10, 25]}
      enableRowSelection
      enableColumnResizing
      enableColumnVisibility
    />
  );
}

export { DataGrid };
export type {
  CellContext,
  Column,
  ColumnAlign,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataGridMode,
  DataGridProps,
  PaginationState,
  FilterState,
  RowId,
  SortDirection,
  SortState,
} from "./types";






