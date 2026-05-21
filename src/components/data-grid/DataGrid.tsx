import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
};

type DataGridProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
};

export function DataGrid({
  columns,
  data,
  loading = false,
  emptyMessage,
}: DataGridProps<T>) {
  if (loading) {
    return <div>Loading....</div>;
  }
}
