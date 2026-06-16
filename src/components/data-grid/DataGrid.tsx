import { useMemo, useState } from "react";
import type { Column, DataGridProps, SortState } from "./types";
import {
  getAlignClass,
  getColumnId,
  getColumnStyle,
  getColumnValue,
  getNextSortState,
  sortRows,
} from "./utils";

export function DataGrid<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  getRowId,
  defaultSort = null,
  sort,
  onSortChange,
}: DataGridProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort,
  );
  const activeSort = sort === undefined ? internalSort : sort;
  const sortedData = useMemo(
    () => sortRows(data, columns, activeSort),
    [activeSort, columns, data],
  );

  function handleSort(column: Column<T>) {
    if (!column.sortable) {
      return;
    }

    const nextSort = getNextSortState(column, activeSort);

    if (sort === undefined) {
      setInternalSort(nextSort);
    }

    onSortChange?.(nextSort);
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading....</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={getColumnId(column)}
                className={`px-4 py-3 font-medium text-gray-700 ${getAlignClass(column)}`}
                style={getColumnStyle(column)}
                aria-sort={getAriaSort(getColumnId(column), activeSort)}
                scope="col"
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-inherit"
                    onClick={() => handleSort(column)}
                  >
                    <span>{column.header}</span>
                    <span aria-hidden="true" className="text-xs text-gray-400">
                      {getSortIndicator(getColumnId(column), activeSort)}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={getRowId ? getRowId(row, rowIndex) : rowIndex}
                className="border-t border-gray-200"
              >
                {columns.map((column) => {
                  const value = getColumnValue(row, column);

                  return (
                    <td
                      key={getColumnId(column)}
                      className={`px-4 py-3 text-gray-700 ${getAlignClass(column)}`}
                      style={getColumnStyle(column)}
                    >
                      {column.cell
                        ? column.cell({ row, value, rowIndex, column })
                        : column.render
                          ? column.render(row)
                          : String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function getSortIndicator(
  columnId: string,
  sort: DataGridProps<unknown>["sort"],
) {
  if (sort?.columnId !== columnId) {
    return "↕";
  }

  return sort.direction === "asc" ? "↑" : "↓";
}

function getAriaSort(
  columnId: string,
  sort: DataGridProps<unknown>["sort"],
) {
  if (sort?.columnId !== columnId) {
    return "none";
  }

  return sort.direction === "asc" ? "ascending" : "descending";
}
