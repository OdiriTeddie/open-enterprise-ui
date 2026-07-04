import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Column,
  ColumnSizingState,
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

const DEFAULT_MIN_COLUMN_WIDTH = 80;
const COLUMN_RESIZE_KEYBOARD_STEP = 10;

export function DataGrid<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  renderLoading,
  renderEmpty,
  renderNoResults,
  getRowId,
  defaultSort = null,
  sort,
  onSortChange,
  defaultPagination = DEFAULT_PAGINATION,
  pagination,
  onPaginationChange,
  pageSizeOptions = [10, 25, 50],
  showPagination = true,
  defaultFilter = DEFAULT_FILTER,
  filter,
  onFilterChange,
  showGlobalFilter = true,
  globalFilterPlaceholder = "Search rows...",
  enableRowSelection = false,
  defaultSelectedRowIds = [],
  selectedRowIds,
  onRowSelectionChange,
  ariaLabel = "Data grid",
  enableColumnResizing = false,
  defaultColumnSizing = {},
  columnSizing,
  onColumnSizingChange,
  minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
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
  const [internalColumnSizing, setInternalColumnSizing] =
    useState<ColumnSizingState>(defaultColumnSizing);
  const activeSort = sort === undefined ? internalSort : sort;
  const activePagination =
    pagination === undefined ? internalPagination : pagination;
  const activeFilter = filter === undefined ? internalFilter : filter;
  const activeSelectedRowIds =
    selectedRowIds === undefined ? internalSelectedRowIds : selectedRowIds;
  const activeColumnSizing =
    columnSizing === undefined ? internalColumnSizing : columnSizing;
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
  const areSomeVisibleRowsSelected =
    selectedVisibleRowCount > 0 && !areAllVisibleRowsSelected;
  const hasRows = data.length > 0;
  const hasVisibleRows = paginatedData.length > 0;
  const emptyColumnSpan = columns.length + (enableRowSelection ? 1 : 0);
  const firstVisibleRowNumber = hasVisibleRows
    ? safePagination.pageIndex * safePagination.pageSize + 1
    : 0;
  const lastVisibleRowNumber = Math.min(
    (safePagination.pageIndex + 1) * safePagination.pageSize,
    sortedData.length,
  );
  const shouldRenderPagination =
    showPagination &&
    (sortedData.length > safePagination.pageSize || pageSizeOptions.length > 1);

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

  function handleColumnSizingChange(nextColumnSizing: ColumnSizingState) {
    if (columnSizing === undefined) {
      setInternalColumnSizing(nextColumnSizing);
    }

    onColumnSizingChange?.(nextColumnSizing);
  }

  function resizeColumn(column: Column<T>, nextWidth: number) {
    const columnId = getColumnId(column);
    const clampedWidth = Math.max(minColumnWidth, Math.round(nextWidth));

    handleColumnSizingChange({
      ...activeColumnSizing,
      [columnId]: clampedWidth,
    });
  }

  function getColumnResizeStartWidth(
    column: Column<T>,
    fallbackWidth: number,
  ) {
    const columnId = getColumnId(column);
    const sizedWidth = activeColumnSizing[columnId];

    if (typeof sizedWidth === "number") {
      return sizedWidth;
    }

    if (typeof column.width === "number") {
      return column.width;
    }

    return Math.max(minColumnWidth, fallbackWidth);
  }

  function handleColumnResizePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    column: Column<T>,
  ) {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = getColumnResizeStartWidth(
      column,
      event.currentTarget.parentElement?.getBoundingClientRect().width ??
        minColumnWidth,
    );

    function handlePointerMove(pointerEvent: PointerEvent) {
      resizeColumn(column, startWidth + pointerEvent.clientX - startX);
    }

    function handlePointerUp() {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }

  function handleColumnResizeKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    column: Column<T>,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const currentWidth = getColumnResizeStartWidth(column, minColumnWidth);
    const direction = event.key === "ArrowRight" ? 1 : -1;

    resizeColumn(
      column,
      currentWidth + direction * COLUMN_RESIZE_KEYBOARD_STEP,
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500" role="status" aria-live="polite">
        {renderLoading ? renderLoading() : "Loading...."}
      </div>
    );
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
        <table aria-label={ariaLabel} className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              {enableRowSelection ? (
                <th className="w-12 px-4 py-3" scope="col">
                  <SelectAllCheckbox
                    checked={areAllVisibleRowsSelected}
                    disabled={!hasVisibleRows}
                    indeterminate={areSomeVisibleRowsSelected}
                    onChange={(checked) =>
                      handleVisibleRowsSelectionChange(checked)
                    }
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={getColumnId(column)}
                  className={`relative px-4 py-3 font-medium text-gray-700 ${getAlignClass(column)}`}
                  style={getResolvedColumnStyle(column, activeColumnSizing)}
                  aria-sort={getAriaSort(getColumnId(column), activeSort)}
                  scope="col"
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      aria-label={getSortButtonLabel(column, activeSort)}
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
                  {enableColumnResizing ? (
                    <button
                      type="button"
                      aria-label={`Resize ${getColumnHeaderLabel(column)} column`}
                      aria-orientation="vertical"
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none border-r border-transparent outline-none focus:border-gray-500"
                      onKeyDown={(event) => handleColumnResizeKeyDown(event, column)}
                      onPointerDown={(event) =>
                        handleColumnResizePointerDown(event, column)
                      }
                    />
                  ) : null}
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
                  <div role="status" aria-live="polite">
                    {hasRows
                      ? renderNoResults
                        ? renderNoResults()
                        : "No matching rows found."
                      : renderEmpty
                        ? renderEmpty()
                        : emptyMessage}
                  </div>
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
                        style={getResolvedColumnStyle(column, activeColumnSizing)}
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

      {shouldRenderPagination ? (
        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                aria-label="Rows per page"
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                value={safePagination.pageSize}
                onChange={(event) =>
                  handlePageSizeChange(Number(event.target.value))
                }
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </label>

            <span aria-live="polite">
              {firstVisibleRowNumber}-{lastVisibleRowNumber} of {sortedData.length}
            </span>
          </div>

          <nav aria-label="Pagination" className="flex items-center gap-3">
            <span aria-live="polite">
              Page {safePagination.pageIndex + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Go to first page"
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safePagination.pageIndex === 0}
                onClick={() =>
                  handlePaginationChange({
                    ...safePagination,
                    pageIndex: 0,
                  })
                }
              >
                First
              </button>
              <button
                type="button"
                aria-label="Go to previous page"
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
                aria-label="Go to next page"
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
              <button
                type="button"
                aria-label="Go to last page"
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safePagination.pageIndex >= pageCount - 1}
                onClick={() =>
                  handlePaginationChange({
                    ...safePagination,
                    pageIndex: pageCount - 1,
                  })
                }
              >
                Last
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function getResolvedColumnStyle<T>(
  column: Column<T>,
  columnSizing: ColumnSizingState,
) {
  const columnId = getColumnId(column);
  const sizedWidth = columnSizing[columnId];

  if (typeof sizedWidth === "number") {
    return { width: `${sizedWidth}px` };
  }

  return getColumnStyle(column);
}
function SelectAllCheckbox({
  checked,
  disabled,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label="Select all visible rows"
      checked={checked}
      className="h-4 w-4 rounded border-gray-300"
      disabled={disabled}
      type="checkbox"
      onChange={(event) => onChange(event.target.checked)}
    />
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

function getSortButtonLabel<T>(column: Column<T>, sort: SortState | null) {
  const columnId = getColumnId(column);
  const headerLabel = getColumnHeaderLabel(column);

  if (sort?.columnId !== columnId) {
    return `Sort by ${headerLabel} ascending`;
  }

  if (sort.direction === "asc") {
    return `Sort by ${headerLabel} descending`;
  }

  return `Clear sort for ${headerLabel}`;
}

function getColumnHeaderLabel<T>(column: Column<T>) {
  if (typeof column.header === "string" || typeof column.header === "number") {
    return String(column.header);
  }

  return getColumnId(column);
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




