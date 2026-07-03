import { useMemo, useState } from "react";
import type {
  Column,
  DataGridProps,
  PaginationState,
  SortState,
} from "./types";
import {
  clampPageIndex,
  getAlignClass,
  getColumnId,
  getColumnStyle,
  getColumnValue,
  getNextSortState,
  getPageCount,
  paginateRows,
  sortRows,
} from "./utils";

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 10,
};

export function DataGrid<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  getRowId,
  defaultSort = null,
  sort,
  onSortChange,
  defaultPagination = DEFAULT_PAGINATION,
  pagination,
  onPaginationChange,
  pageSizeOptions = [10, 25, 50],
}: DataGridProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort,
  );
  const [internalPagination, setInternalPagination] =
    useState<PaginationState>(defaultPagination);
  const activeSort = sort === undefined ? internalSort : sort;
  const activePagination =
    pagination === undefined ? internalPagination : pagination;
  const sortedData = useMemo(
    () => sortRows(data, columns, activeSort),
    [activeSort, columns, data],
  );
  const pageCount = getPageCount(sortedData.length, activePagination.pageSize);
  const safePagination = useMemo(
    () => ({
      ...activePagination,
      pageIndex: clampPageIndex(activePagination.pageIndex, pageCount),
    }),
    [activePagination, pageCount],
  );
  const paginatedData = useMemo(
    () => paginateRows(sortedData, safePagination),
    [safePagination, sortedData],
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

  function handlePaginationChange(nextPagination: PaginationState) {
    const nextPageCount = getPageCount(
      sortedData.length,
      nextPagination.pageSize,
    );
    const nextState = {
      ...nextPagination,
      pageIndex: clampPageIndex(nextPagination.pageIndex, nextPageCount),
    };

    if (pagination === undefined) {
      setInternalPagination(nextState);
    }

    onPaginationChange?.(nextState);
  }

  function handlePageSizeChange(pageSize: number) {
    handlePaginationChange({ pageIndex: 0, pageSize });
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading....</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
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
              paginatedData.map((row, rowIndex) => {
                const absoluteRowIndex =
                  safePagination.pageIndex * safePagination.pageSize + rowIndex;

                return (
                  <tr
                    key={
                      getRowId
                        ? getRowId(row, absoluteRowIndex)
                        : absoluteRowIndex
                    }
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
                            ? column.cell({
                                row,
                                value,
                                rowIndex: absoluteRowIndex,
                                column,
                              })
                            : column.render
                              ? column.render(row)
                              : String(value ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
            value={safePagination.pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3">
          <span>
            Page {safePagination.pageIndex + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePagination.pageIndex === 0}
              onClick={() =>
                handlePaginationChange({
                  ...safePagination,
                  pageIndex: safePagination.pageIndex - 1,
                })
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePagination.pageIndex >= pageCount - 1}
              onClick={() =>
                handlePaginationChange({
                  ...safePagination,
                  pageIndex: safePagination.pageIndex + 1,
                })
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSortIndicator(
  columnId: string,
  sort: DataGridProps<unknown>["sort"],
) {
  if (sort?.columnId !== columnId) {
    return "-";
  }

  return sort.direction === "asc" ? "ASC" : "DESC";
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
