import type {
  Column,
  ColumnOrderState,
  ColumnPinningState,
  FilterState,
  PaginationState,
  SortState,
} from "./types";

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

export function orderColumns<T>(
  columns: Column<T>[],
  columnOrder: ColumnOrderState,
): Column<T>[] {
  if (columnOrder.length === 0) {
    return columns;
  }

  const columnsById = new Map(
    columns.map((column) => [getColumnId(column), column] as const),
  );
  const orderedColumns: Column<T>[] = [];
  const orderedColumnIds = new Set<string>();

  columnOrder.forEach((columnId) => {
    const column = columnsById.get(columnId);

    if (column) {
      orderedColumns.push(column);
      orderedColumnIds.add(columnId);
    }
  });

  columns.forEach((column) => {
    const columnId = getColumnId(column);

    if (!orderedColumnIds.has(columnId)) {
      orderedColumns.push(column);
    }
  });

  return orderedColumns;
}

export function pinColumns<T>(
  columns: Column<T>[],
  columnPinning: ColumnPinningState,
): Column<T>[] {
  const pinnedLeftColumnIds = new Set(columnPinning.left);
  const pinnedColumnIds = new Set([
    ...columnPinning.left,
    ...columnPinning.right,
  ]);

  const leftColumns = columnPinning.left
    .map((columnId) =>
      columns.find((column) => getColumnId(column) === columnId),
    )
    .filter((column): column is Column<T> => Boolean(column));
  const centerColumns = columns.filter(
    (column) => !pinnedColumnIds.has(getColumnId(column)),
  );
  const rightColumns = columnPinning.right
    .map((columnId) =>
      columns.find((column) => getColumnId(column) === columnId),
    )
    .filter((column): column is Column<T> => Boolean(column));

  return [
    ...leftColumns,
    ...centerColumns,
    ...rightColumns.filter(
      (column) => !pinnedLeftColumnIds.has(getColumnId(column)),
    ),
  ];
}

export function filterRows<T>(
  rows: T[],
  columns: Column<T>[],
  filter: FilterState,
): T[] {
  const query = filter.global.trim().toLowerCase();

  if (!query) {
    return rows;
  }

  const filterableColumns = columns.filter((column) => column.filterable !== false);

  return rows.filter((row) =>
    filterableColumns.some((column) => {
      const value = getFilterValue(row, column);

      if (value == null) {
        return false;
      }

      return String(value).toLowerCase().includes(query);
    }),
  );
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

export function paginateRows<T>(
  rows: T[],
  pagination: PaginationState,
): T[] {
  const start = pagination.pageIndex * pagination.pageSize;
  const end = start + pagination.pageSize;

  return rows.slice(start, end);
}

export function getPageCount(rowCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rowCount / pageSize));
}

export function clampPageIndex(pageIndex: number, pageCount: number): number {
  return Math.min(Math.max(pageIndex, 0), pageCount - 1);
}

function getSortValue<T>(row: T, column: Column<T>) {
  return column.sortAccessor
    ? column.sortAccessor(row)
    : getColumnValue(row, column);
}

function getFilterValue<T>(row: T, column: Column<T>) {
  return column.filterAccessor
    ? column.filterAccessor(row)
    : getColumnValue(row, column);
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
