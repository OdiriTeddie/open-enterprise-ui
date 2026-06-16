import type { Column } from "./types";

export function getColumnId<T>(column: Column<T>): string {
  return String(column.id ?? column.accessorKey ?? column.key);
}

export function getColumnValue<T>(row: T, column: Column<T>): unknown {
  if (column.accessorFn) {
    return column.accessorFn(row);
  }

  const key = column.accessorKey ?? column.key;

  if (!key) {
    return undefined;
  }

  return row[key as keyof T];
}

export function getAlignClass<T>(column: Column<T>): string {
  switch (column.align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

export function getColumnStyle<T>(column: Column<T>) {
  if (!column.width) {
    return undefined;
  }

  return {
    width: typeof column.width === "number" ? `${column.width}px` : column.width,
  };
}
