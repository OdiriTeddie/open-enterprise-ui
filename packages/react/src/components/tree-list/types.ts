import type { ReactNode } from "react";

export type TreeListRowId = string | number;
export type TreeListColumnAlign = "left" | "center" | "right";
export type TreeListSelectionMode = "none" | "single" | "multiple";
export type TreeListSortDirection = "asc" | "desc";
export type TreeListFilterMode = "match-only" | "include-ancestors" | "include-descendants";
export type TreeListColumnSizingState = Record<string, number>;
export type TreeListColumnVisibilityState = Record<string, boolean>;
export type TreeListColumnOrderState = string[];
export type TreeListColumnPinningState = {
  left: string[];
  right: string[];
};

export type TreeListSortState = {
  columnId: string;
  direction: TreeListSortDirection;
};

export type TreeListFilterState = {
  global: string;
};

export type TreeListCellContext<T, TValue = unknown> = {
  column: TreeListColumn<T, TValue>;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  row: T;
  rowIndex: number;
  value: TValue;
};

export type TreeListColumn<T, TValue = unknown> = {
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
  align?: TreeListColumnAlign;
  width?: number | string;
};

export type TreeListNode<T> = {
  children: TreeListNode<T>[];
  depth: number;
  id: TreeListRowId;
  parentId: TreeListRowId | null;
  row: T;
};

export type TreeListVisibleRow<T> = {
  depth: number;
  hasChildren: boolean;
  id: TreeListRowId;
  isExpanded: boolean;
  isLoading: boolean;
  parentId: TreeListRowId | null;
  row: T;
};

export type TreeListProps<T> = {
  ariaLabel?: string;
  columns: TreeListColumn<T>[];
  data: T[];
  defaultColumnOrder?: TreeListColumnOrderState;
  defaultColumnPinning?: TreeListColumnPinningState;
  defaultColumnSizing?: TreeListColumnSizingState;
  defaultColumnVisibility?: TreeListColumnVisibilityState;
  defaultExpandedRowIds?: TreeListRowId[];
  defaultFilter?: TreeListFilterState;
  defaultSort?: TreeListSortState | null;
  defaultSelectedRowIds?: TreeListRowId[];
  emptyMessage?: string;
  errorMessage?: string;
  columnOrder?: TreeListColumnOrderState;
  columnPinning?: TreeListColumnPinningState;
  columnSizing?: TreeListColumnSizingState;
  columnVisibility?: TreeListColumnVisibilityState;
  enableCascadeSelection?: boolean;
  enableColumnResizing?: boolean;
  expandedRowIds?: TreeListRowId[];
  filter?: TreeListFilterState;
  filterMode?: TreeListFilterMode;
  globalFilterPlaceholder?: string;
  getParentId?: (row: T) => TreeListRowId | null | undefined;
  getRowId: (row: T, index: number) => TreeListRowId;
  isRowExpandable?: (row: T) => boolean;
  loadChildren?: (row: T) => T[] | Promise<T[]>;
  loadingRowIds?: TreeListRowId[];
  onExpandedRowIdsChange?: (expandedRowIds: TreeListRowId[]) => void;
  onError?: (error: unknown) => void;
  onFilterChange?: (filter: TreeListFilterState) => void;
  onColumnSizingChange?: (columnSizing: TreeListColumnSizingState) => void;
  onRowCollapse?: (row: T) => void;
  onRowExpand?: (row: T) => void;
  onSelectedRowIdsChange?: (selectedRowIds: TreeListRowId[]) => void;
  renderEmpty?: () => ReactNode;
  renderLoadingRow?: (row: T) => ReactNode;
  minColumnWidth?: number;
  selectedRowIds?: TreeListRowId[];
  showGlobalFilter?: boolean;
  selectionMode?: TreeListSelectionMode;
  sort?: TreeListSortState | null;
  onSortChange?: (sort: TreeListSortState | null) => void;
};
