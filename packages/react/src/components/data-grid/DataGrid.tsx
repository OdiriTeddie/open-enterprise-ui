import { useMemo, useState } from "react";
import type {
  Column,
  DataGridProps,
  FilterState,
  PaginationState,
  RowId,
  SortState,
} from "./types";
import {
  clampPageIndex,
  filterRows,
  getAlignClass,
  getColumnId,
  getColumnStyle,
  getColumnValue,
  getNextSortState,
  getPageCount,
  paginateRows,
  sortRows,
} from "./utils";

const DEFAULT_FILTER: FilterState = {
  global: "",
};

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
  defaultFilter = DEFAULT_FILTER,
  filter,
  onFilterChange,
  showGlobalFilter = true,
  globalFilterPlaceholder = "Search rows...",
  enableRowSelection = false,
  defaultSelectedRowIds = [],
  selectedRowIds,
  onRowSelectionChange,
}: DataGridProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort,
  );
  const [internalPagination, setInternalPagination] =
    useState<PaginationState>(defaultPagination);
  const [internalFilter, setInternalFilter] =
    useState<FilterState>(defaultFilter);
  const [internalSelectedRowIds, setInternalSelectedRowIds] =
    useState<RowId[]>(defaultSelectedRowIds);
  const activeSort = sort === undefined ? internalSort : sort;
  const activePagination =
    pagination === undefined ? internalPagination : pagination;
  const activeFilter = filter === undefined ? internalFilter : filter;
  const activeSelectedRowIds =
    selectedRowIds === undefined ? internalSelectedRowIds : selectedRowIds;
  const selectedRowIdSet = useMemo(
    () => new Set(activeSelectedRowIds),
    [activeSelectedRowIds],
  );
  const filteredData = useMemo(
    () => filterRows(data, columns, activeFilter),
    [activeFilter, columns, data],
  );
  const sortedData = useMemo(
    () => sortRows(filteredData, columns, activeSort),
    [activeSort, columns, filteredData],
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
  const visibleRows = useMemo(
    () =>
      paginatedData.map((row, rowIndex) => {
        const rowIndexInData =
          safePagination.pageIndex * safePagination.pageSize + rowIndex;

        return {
          row,
          rowIndex: rowIndexInData,
          rowId: getResolvedRowId(row, rowIndexInData, getRowId),
        };
      }),
    [getRowId, paginatedData, safePagination],
  );
  const visibleRowIds = visibleRows.map((row) => row.rowId);
  const selectedVisibleRowCount = visibleRowIds.filter((rowId) =>
    selectedRowIdSet.has(rowId),
  ).length;
  const areAllVisibleRowsSelected =
    visibleRowIds.length > 0 && selectedVisibleRowCount === visibleRowIds.length;
  const hasRows = data.length > 0;
  const hasVisibleRows = paginatedData.length > 0;
  const emptyColumnSpan = columns.length + (enableRowSelection ? 1 : 0);

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

  function handleFilterChange(nextFilter: FilterState) {
    if (filter === undefined) {
      setInternalFilter(nextFilter);
    }

    handlePaginationChange({
      ...safePagination,
      pageIndex: 0,
    });
    onFilterChange?.(nextFilter);
  }

  function handleSelectedRowIdsChange(nextSelectedRowIds: RowId[]) {
    if (selectedRowIds === undefined) {
      setInternalSelectedRowIds(nextSelectedRowIds);
    }

    onRowSelectionChange?.(nextSelectedRowIds);
  }

  function handleRowSelectionChange(rowId: RowId, checked: boolean) {
    const nextSelectedRowIdSet = new Set(activeSelectedRowIds);

    if (checked) {
      nextSelectedRowIdSet.add(rowId);
    } else {
      nextSelectedRowIdSet.delete(rowId);
    }

    handleSelectedRowIdsChange(Array.from(nextSelectedRowIdSet));
  }

  function handleVisibleRowsSelectionChange(checked: boolean) {
    const nextSelectedRowIdSet = new Set(activeSelectedRowIds);

    visibleRowIds.forEach((rowId) => {
      if (checked) {
        nextSelectedRowIdSet.add(rowId);
      } else {
        nextSelectedRowIdSet.delete(rowId);
      }
    });

    handleSelectedRowIdsChange(Array.from(nextSelectedRowIdSet));
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading....</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      {showGlobalFilter ? (
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <label className="block max-w-sm text-sm text-gray-600">
            <span className="mb-1 block font-medium text-gray-700">Search</span>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500"
              placeholder={globalFilterPlaceholder}
              type="search"
              value={activeFilter.global}
              onChange={(event) =>
                handleFilterChange({ global: event.target.value })
              }
            />
          </label>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              {enableRowSelection ? (
                <th className="w-12 px-4 py-3" scope="col">
                  <input
                    aria-label="Select all visible rows"
                    checked={areAllVisibleRowsSelected}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={!hasVisibleRows}
                    type="checkbox"
                    onChange={(event) =>
                      handleVisibleRowsSelectionChange(event.target.checked)
                    }
                  />
                </th>
              ) : null}
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
            {!hasVisibleRows ? (
              <tr>
                <td
                  colSpan={emptyColumnSpan}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  {hasRows ? "No matching rows found." : emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map(({ row, rowId, rowIndex }) => (
                <tr key={rowId} className="border-t border-gray-200">
                  {enableRowSelection ? (
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Select row ${rowIndex + 1}`}
                        checked={selectedRowIdSet.has(rowId)}
                        className="h-4 w-4 rounded border-gray-300"
                        type="checkbox"
                        onChange={(event) =>
                          handleRowSelectionChange(rowId, event.target.checked)
                        }
                      />
                    </td>
                  ) : null}
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
                              rowIndex,
                              column,
                            })
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

function getResolvedRowId<T>(
  row: T,
  rowIndex: number,
  getRowId?: DataGridProps<T>["getRowId"],
): RowId {
  return getRowId ? getRowId(row, rowIndex) : rowIndex;
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
