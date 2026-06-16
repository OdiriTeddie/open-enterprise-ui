import type { ReactNode } from "react";

export type ColumnAlign = "left" | "center" | "right";

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
};

export type DataGridProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  getRowId?: (row: T, index: number) => string | number;
};
