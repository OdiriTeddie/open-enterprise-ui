import type { Column, SortState } from "./types";

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

export function getNextSortState<T>(
  column: Column<T>,
  currentSort: SortState | null,
): SortState | null {
  const columnId = getColumnId(column);

  if (currentSort?.columnId !== columnId) {
    return { columnId, direction: "asc" };
  }

  if (currentSort.direction === "asc") {
    return { columnId, direction: "desc" };
  }

  return null;
}

export function sortRows<T>(
  rows: T[],
  columns: Column<T>[],
  sort: SortState | null,
): T[] {
  if (!sort) {
    return rows;
  }

  const column = columns.find((item) => getColumnId(item) === sort.columnId);

  if (!column) {
    return rows;
  }

  return [...rows].sort((firstRow, secondRow) => {
    const firstValue = getSortValue(firstRow, column);
    const secondValue = getSortValue(secondRow, column);
    const comparison = compareValues(firstValue, secondValue);

    return sort.direction === "asc" ? comparison : comparison * -1;
  });
}

function getSortValue<T>(row: T, column: Column<T>) {
  return column.sortAccessor ? column.sortAccessor(row) : getColumnValue(row, column);
}

function compareValues(firstValue: unknown, secondValue: unknown): number {
  if (firstValue == null && secondValue == null) {
    return 0;
  }

  if (firstValue == null) {
    return 1;
  }

  if (secondValue == null) {
    return -1;
  }

  if (firstValue instanceof Date && secondValue instanceof Date) {
    return firstValue.getTime() - secondValue.getTime();
  }

  if (typeof firstValue === "number" && typeof secondValue === "number") {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
