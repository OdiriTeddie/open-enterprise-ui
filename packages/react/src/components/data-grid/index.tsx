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
];

export function DataGridExample() {
  return (
    <DataGrid
      columns={columns}
      data={users}
      emptyMessage="No users found."
      getRowId={(user) => user.id}
    />
  );
}

export { DataGrid };
export type {
  CellContext,
  Column,
  ColumnAlign,
  DataGridProps,
  SortDirection,
  SortState,
} from "./types";
