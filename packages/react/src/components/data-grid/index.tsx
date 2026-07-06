import { useMemo, useState } from "react";
import { DataGrid } from "./DataGrid";
import type { Column, FilterState, PaginationState, SortState } from "./types";

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
  { id: 7, name: "Margaret Hamilton", role: "Engineer", status: "Active" },
  { id: 8, name: "Joan Clarke", role: "Analyst", status: "Invited" },
  { id: 9, name: "Evelyn Boyd Granville", role: "Admin", status: "Active" },
  { id: 10, name: "Maryam Mirzakhani", role: "Analyst", status: "Invited" },
  { id: 11, name: "Radia Perlman", role: "Engineer", status: "Active" },
  { id: 12, name: "Karen Sparck Jones", role: "Analyst", status: "Active" },
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


export function ServerSideDataGridExample() {
  const [sort, setSort] = useState<SortState | null>(null);
  const [filter, setFilter] = useState<FilterState>({ global: "" });
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  const serverResult = useMemo(
    () => getServerUsers({ filter, pagination, sort }),
    [filter, pagination, sort],
  );

  return (
    <DataGrid
      ariaLabel="Server-side users table"
      columns={columns}
      data={serverResult.rows}
      emptyMessage="No users found."
      getRowId={(user) => user.id}
      mode="server"
      rowCount={serverResult.rowCount}
      sort={sort}
      onSortChange={setSort}
      filter={filter}
      onFilterChange={setFilter}
      pagination={pagination}
      onPaginationChange={setPagination}
      pageSizeOptions={[5, 10]}
      enableColumnMenu
    />
  );
}

function getServerUsers({
  filter,
  pagination,
  sort,
}: {
  filter: FilterState;
  pagination: PaginationState;
  sort: SortState | null;
}) {
  const query = filter.global.trim().toLowerCase();
  const filteredUsers = query
    ? users.filter((user) =>
        [user.name, user.role, user.status].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    : users;
  const sortedUsers = sort
    ? [...filteredUsers].sort((firstUser, secondUser) => {
        const firstValue = String(firstUser[sort.columnId as keyof User]);
        const secondValue = String(secondUser[sort.columnId as keyof User]);
        const comparison = firstValue.localeCompare(secondValue, undefined, {
          numeric: true,
          sensitivity: "base",
        });

        return sort.direction === "asc" ? comparison : comparison * -1;
      })
    : filteredUsers;
  const start = pagination.pageIndex * pagination.pageSize;

  return {
    rows: sortedUsers.slice(start, start + pagination.pageSize),
    rowCount: sortedUsers.length,
  };
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






