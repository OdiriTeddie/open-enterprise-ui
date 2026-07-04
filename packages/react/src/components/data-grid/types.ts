import type { ReactNode } from "react";

export type ColumnAlign = "left" | "center" | "right";
export type RowId = string | number;
export type ColumnSizingState = Record<string, number>;
export type ColumnVisibilityState = Record<string, boolean>;
export type SortDirection = "asc" | "desc";
export type DataGridMode = "client" | "server";

export type SortState = {
  columnId: string;
  direction: SortDirection;
};

export type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

export type FilterState = {
  global: string;
};

export type CellContext<T, TValue = unknown> = {
  row: T;
  value: TValue;
  rowIndex: number;
  column: Column<T, TValue>;
};

export type Column<T, TValue = unknown> = {
  id?: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => TValue;
  key?: keyof T | string;
  header: ReactNode;
  cell?: (context: CellContext<T, TValue>) => ReactNode;
  render?: (row: T) => ReactNode;
  align?: ColumnAlign;
  width?: number | string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  filterable?: boolean;
  filterAccessor?: (row: T) => string | number | boolean | Date | null | undefined;
};

export type DataGridProps<T> = {
  columns: Column<T>[];
  data: T[];
  mode?: DataGridMode;
  rowCount?: number;
  loading?: boolean;
  emptyMessage?: string;
  renderLoading?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  renderNoResults?: () => ReactNode;
  getRowId?: (row: T, index: number) => RowId;
  defaultSort?: SortState | null;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  defaultPagination?: PaginationState;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  defaultFilter?: FilterState;
  filter?: FilterState;
  onFilterChange?: (filter: FilterState) => void;
  showGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  enableRowSelection?: boolean;
  defaultSelectedRowIds?: RowId[];
  selectedRowIds?: RowId[];
  onRowSelectionChange?: (selectedRowIds: RowId[]) => void;
  ariaLabel?: string;
  enableColumnResizing?: boolean;
  defaultColumnSizing?: ColumnSizingState;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: (columnSizing: ColumnSizingState) => void;
  minColumnWidth?: number;
  enableColumnVisibility?: boolean;
  defaultColumnVisibility?: ColumnVisibilityState;
  columnVisibility?: ColumnVisibilityState;
  onColumnVisibilityChange?: (columnVisibility: ColumnVisibilityState) => void;
};






