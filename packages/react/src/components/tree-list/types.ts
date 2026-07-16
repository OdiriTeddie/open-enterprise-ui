import type { ReactNode } from "react";

export type TreeListRowId = string | number;
export type TreeListColumnAlign = "left" | "center" | "right";

export type TreeListCellContext<T, TValue = unknown> = {
  column: TreeListColumn<T, TValue>;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
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
  parentId: TreeListRowId | null;
  row: T;
};

export type TreeListProps<T> = {
  ariaLabel?: string;
  columns: TreeListColumn<T>[];
  data: T[];
  defaultExpandedRowIds?: TreeListRowId[];
  emptyMessage?: string;
  expandedRowIds?: TreeListRowId[];
  getParentId?: (row: T) => TreeListRowId | null | undefined;
  getRowId: (row: T, index: number) => TreeListRowId;
  onExpandedRowIdsChange?: (expandedRowIds: TreeListRowId[]) => void;
  renderEmpty?: () => ReactNode;
};
