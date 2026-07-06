import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  Column,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
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
  getNextMultiSortState,
  getNextSortState,
  getPageCount,
  orderColumns,
  pinColumns,
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
const DEFAULT_COLUMN_PINNING: ColumnPinningState = { left: [], right: [] };
const COLUMN_RESIZE_KEYBOARD_STEP = 10;
const DEFAULT_VIRTUAL_ROW_HEIGHT = 48;
const DEFAULT_VIRTUAL_OVERSCAN = 5;
const DEFAULT_VIRTUAL_VIEWPORT_HEIGHT = 400;

export function DataGrid<T>({
  columns,
  data,
  mode = "client",
  rowCount,
  loading = false,
  emptyMessage,
  renderLoading,
  renderEmpty,
  renderNoResults,
  getRowId,
  defaultSort = null,
  sort,
  onSortChange,
  enableMultiSort = false,
  defaultMultiSort = [],
  multiSort,
  onMultiSortChange,
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
  enableVirtualization = false,
  virtualRowHeight = DEFAULT_VIRTUAL_ROW_HEIGHT,
  virtualOverscan = DEFAULT_VIRTUAL_OVERSCAN,
  virtualViewportHeight = DEFAULT_VIRTUAL_VIEWPORT_HEIGHT,
  enableColumnResizing = false,
  defaultColumnSizing = {},
  columnSizing,
  onColumnSizingChange,
  minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
  defaultColumnOrder = [],
  columnOrder,
  defaultColumnPinning = DEFAULT_COLUMN_PINNING,
  columnPinning,
  onColumnPinningChange,
  enableColumnMenu = false,
  enableColumnVisibility = false,
  defaultColumnVisibility = {},
  columnVisibility,
  onColumnVisibilityChange,
}: DataGridProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort,
  );
  const [internalMultiSort, setInternalMultiSort] =
    useState<SortState[]>(defaultMultiSort);
  const [internalPagination, setInternalPagination] =
    useState<PaginationState>(defaultPagination);
  const [internalFilter, setInternalFilter] =
    useState<FilterState>(defaultFilter);
  const [internalSelectedRowIds, setInternalSelectedRowIds] =
    useState<RowId[]>(defaultSelectedRowIds);
  const [internalColumnSizing, setInternalColumnSizing] =
    useState<ColumnSizingState>(defaultColumnSizing);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<ColumnVisibilityState>(defaultColumnVisibility);
  const [internalColumnOrder] = useState<ColumnOrderState>(defaultColumnOrder);
  const [internalColumnPinning, setInternalColumnPinning] =
    useState<ColumnPinningState>(defaultColumnPinning);
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const activeSort = sort === undefined ? internalSort : sort;
  const activeMultiSort = multiSort === undefined ? internalMultiSort : multiSort;
  const activeSortState = enableMultiSort ? activeMultiSort : activeSort;
  const activeSortList = enableMultiSort
    ? activeMultiSort
    : activeSort
      ? [activeSort]
      : [];
  const activePagination =
    pagination === undefined ? internalPagination : pagination;
  const activeFilter = filter === undefined ? internalFilter : filter;
  const activeSelectedRowIds =
    selectedRowIds === undefined ? internalSelectedRowIds : selectedRowIds;
  const activeColumnSizing =
    columnSizing === undefined ? internalColumnSizing : columnSizing;
  const activeColumnVisibility =
    columnVisibility === undefined
      ? internalColumnVisibility
      : columnVisibility;
  const activeColumnOrder =
    columnOrder === undefined ? internalColumnOrder : columnOrder;
  const activeColumnPinning =
    columnPinning === undefined ? internalColumnPinning : columnPinning;
  const isServerMode = mode === "server";
  const orderedColumns = useMemo(
    () => orderColumns(columns, activeColumnOrder),
    [activeColumnOrder, columns],
  );
  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter(
        (column) => activeColumnVisibility[getColumnId(column)] !== false,
      ),
    [activeColumnVisibility, orderedColumns],
  );
  const renderedColumns = useMemo(
    () => pinColumns(visibleColumns, activeColumnPinning),
    [activeColumnPinning, visibleColumns],
  );
  const pinnedColumnOffsets = useMemo(
    () =>
      getPinnedColumnOffsets(
        renderedColumns,
        activeColumnPinning,
        activeColumnSizing,
        minColumnWidth,
      ),
    [activeColumnPinning, activeColumnSizing, minColumnWidth, renderedColumns],
  );
  const selectedRowIdSet = useMemo(
    () => new Set(activeSelectedRowIds),
    [activeSelectedRowIds],
  );
  const filteredData = useMemo(
    () => (isServerMode ? data : filterRows(data, columns, activeFilter)),
    [activeFilter, columns, data, isServerMode],
  );
  const sortedData = useMemo(
    () =>
      isServerMode
        ? filteredData
        : sortRows(filteredData, columns, activeSortState),
    [activeSortState, columns, filteredData, isServerMode],
  );
  const totalRowCount = isServerMode ? (rowCount ?? data.length) : sortedData.length;
  const pageCount = getPageCount(totalRowCount, activePagination.pageSize);
  const safePagination = useMemo(
    () => ({
      ...activePagination,
      pageIndex: clampPageIndex(activePagination.pageIndex, pageCount),
    }),
    [activePagination, pageCount],
  );
  const paginatedData = useMemo(
    () => (isServerMode ? sortedData : paginateRows(sortedData, safePagination)),
    [isServerMode, safePagination, sortedData],
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
  const virtualRange = useMemo(
    () =>
      getVirtualRange({
        enabled: enableVirtualization,
        overscan: virtualOverscan,
        rowCount: visibleRows.length,
        rowHeight: virtualRowHeight,
        scrollTop: virtualScrollTop,
        viewportHeight: virtualViewportHeight,
      }),
    [
      enableVirtualization,
      virtualOverscan,
      virtualRowHeight,
      virtualScrollTop,
      virtualViewportHeight,
      visibleRows.length,
    ],
  );
  const renderedRows = useMemo(
    () => visibleRows.slice(virtualRange.startIndex, virtualRange.endIndex),
    [virtualRange, visibleRows],
  );
  const visibleRowIds = visibleRows.map((row) => row.rowId);
  const selectedVisibleRowCount = visibleRowIds.filter((rowId) =>
    selectedRowIdSet.has(rowId),
  ).length;
  const areAllVisibleRowsSelected =
    visibleRowIds.length > 0 && selectedVisibleRowCount === visibleRowIds.length;
  const areSomeVisibleRowsSelected =
    selectedVisibleRowCount > 0 && !areAllVisibleRowsSelected;
  const hasRows = isServerMode ? totalRowCount > 0 : data.length > 0;
  const hasVisibleRows = paginatedData.length > 0;
  const emptyColumnSpan = renderedColumns.length + (enableRowSelection ? 1 : 0);
  const firstVisibleRowNumber = hasVisibleRows
    ? safePagination.pageIndex * safePagination.pageSize + 1
    : 0;
  const lastVisibleRowNumber = Math.min(
    safePagination.pageIndex * safePagination.pageSize + paginatedData.length,
    totalRowCount,
  );
  const shouldRenderPagination =
    showPagination &&
    (totalRowCount > safePagination.pageSize || pageSizeOptions.length > 1);

  function handleSort(
    column: Column<T>,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (!column.sortable) {
      return;
    }

    if (enableMultiSort) {
      const nextSort = getNextMultiSortState(
        column,
        activeMultiSort,
        event.shiftKey,
      );

      if (multiSort === undefined) {
        setInternalMultiSort(nextSort);
      }

      onMultiSortChange?.(nextSort);
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
      totalRowCount,
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

  function setColumnSort(column: Column<T>, direction: SortState["direction"] | null) {
    const columnId = getColumnId(column);

    if (enableMultiSort) {
      const nextSort = direction
        ? [
            ...activeMultiSort.filter((item) => item.columnId !== columnId),
            { columnId, direction },
          ]
        : activeMultiSort.filter((item) => item.columnId !== columnId);

      if (multiSort === undefined) {
        setInternalMultiSort(nextSort);
      }

      onMultiSortChange?.(nextSort);
      return;
    }

    const nextSort = direction ? { columnId, direction } : null;

    if (sort === undefined) {
      setInternalSort(nextSort);
    }

    onSortChange?.(nextSort);
  }

  function handleColumnPinningChange(nextColumnPinning: ColumnPinningState) {
    if (columnPinning === undefined) {
      setInternalColumnPinning(nextColumnPinning);
    }

    onColumnPinningChange?.(nextColumnPinning);
  }

  function setColumnPinned(column: Column<T>, side: "left" | "right" | null) {
    const columnId = getColumnId(column);
    const nextColumnPinning: ColumnPinningState = {
      left: activeColumnPinning.left.filter((item) => item !== columnId),
      right: activeColumnPinning.right.filter((item) => item !== columnId),
    };

    if (side) {
      nextColumnPinning[side] = [...nextColumnPinning[side], columnId];
    }

    handleColumnPinningChange(nextColumnPinning);
  }

  function resetColumnWidth(column: Column<T>) {
    const columnId = getColumnId(column);
    const nextColumnSizing = { ...activeColumnSizing };

    delete nextColumnSizing[columnId];
    handleColumnSizingChange(nextColumnSizing);
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

  function handleColumnVisibilityChange(
    nextColumnVisibility: ColumnVisibilityState,
  ) {
    if (columnVisibility === undefined) {
      setInternalColumnVisibility(nextColumnVisibility);
    }

    onColumnVisibilityChange?.(nextColumnVisibility);
  }

  function setColumnVisible(column: Column<T>, visible: boolean) {
    handleColumnVisibilityChange({
      ...activeColumnVisibility,
      [getColumnId(column)]: visible,
    });
  }

  function closeColumnMenu() {
    setOpenColumnMenuId(null);
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

      {enableColumnVisibility ? (
        <div className="flex flex-wrap gap-3 border-b border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          {columns.map((column) => {
            const columnId = getColumnId(column);

            return (
              <label key={columnId} className="flex items-center gap-2">
                <input
                  checked={activeColumnVisibility[columnId] !== false}
                  className="h-4 w-4 rounded border-gray-300"
                  type="checkbox"
                  onChange={(event) =>
                    setColumnVisible(column, event.target.checked)
                  }
                />
                <span>{getColumnHeaderLabel(column)}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      <div
        className={enableVirtualization ? "overflow-auto" : "overflow-x-auto"}
        style={
          enableVirtualization
            ? { maxHeight: `${virtualViewportHeight}px` }
            : undefined
        }
        onScroll={(event) => {
          if (enableVirtualization) {
            setVirtualScrollTop(event.currentTarget.scrollTop);
          }
        }}
      >
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
              {renderedColumns.map((column) => (
                <th
                  key={getColumnId(column)}
                  className={`relative px-4 py-3 font-medium text-gray-700 ${getAlignClass(column)}`}
                  style={getResolvedColumnStyle(
                    column,
                    activeColumnSizing,
                    activeColumnPinning,
                    pinnedColumnOffsets,
                  )}
                  aria-sort={getAriaSort(getColumnId(column), activeSortList)}
                  scope="col"
                >
                  <div className="flex items-center justify-between gap-2">
                    {column.sortable ? (
                      <button
                        type="button"
                        aria-label={getSortButtonLabel(column, activeSortList)}
                        className="inline-flex items-center gap-1 font-medium text-inherit"
                        onClick={(event) => handleSort(column, event)}
                      >
                        <span>{column.header}</span>
                        <span aria-hidden="true" className="text-xs text-gray-400">
                          {getSortIndicator(
                            getColumnId(column),
                            activeSortList,
                          )}
                        </span>
                      </button>
                    ) : (
                      <span>{column.header}</span>
                    )}
                    {enableColumnMenu ? (
                      <button
                        type="button"
                        aria-expanded={openColumnMenuId === getColumnId(column)}
                        aria-haspopup="menu"
                        aria-label={`Open ${getColumnHeaderLabel(column)} column menu`}
                        className="rounded px-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
                        onClick={() =>
                          setOpenColumnMenuId((currentColumnId) =>
                            currentColumnId === getColumnId(column)
                              ? null
                              : getColumnId(column),
                          )
                        }
                      >
                        <span aria-hidden="true">...</span>
                      </button>
                    ) : null}
                  </div>
                  {enableColumnMenu && openColumnMenuId === getColumnId(column) ? (
                    <ColumnMenu
                      canHide={renderedColumns.length > 1}
                      column={column}
                      enableColumnResizing={enableColumnResizing}
                      isPinnedLeft={activeColumnPinning.left.includes(
                        getColumnId(column),
                      )}
                      isPinnedRight={activeColumnPinning.right.includes(
                        getColumnId(column),
                      )}
                      onClearSort={() => {
                        setColumnSort(column, null);
                        closeColumnMenu();
                      }}
                      onHideColumn={() => {
                        setColumnVisible(column, false);
                        closeColumnMenu();
                      }}
                      onPinLeft={() => {
                        setColumnPinned(column, "left");
                        closeColumnMenu();
                      }}
                      onPinRight={() => {
                        setColumnPinned(column, "right");
                        closeColumnMenu();
                      }}
                      onResetWidth={() => {
                        resetColumnWidth(column);
                        closeColumnMenu();
                      }}
                      onSortAscending={() => {
                        setColumnSort(column, "asc");
                        closeColumnMenu();
                      }}
                      onSortDescending={() => {
                        setColumnSort(column, "desc");
                        closeColumnMenu();
                      }}
                      onUnpin={() => {
                        setColumnPinned(column, null);
                        closeColumnMenu();
                      }}
                    />
                  ) : null}
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
              <>
                {virtualRange.topSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={emptyColumnSpan}
                      style={{ height: `${virtualRange.topSpacerHeight}px`, padding: 0 }}
                    />
                  </tr>
                ) : null}
                {renderedRows.map(({ row, rowId, rowIndex }) => (
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
                  {renderedColumns.map((column) => {
                    const value = getColumnValue(row, column);

                    return (
                      <td
                        key={getColumnId(column)}
                        className={`px-4 py-3 text-gray-700 ${getAlignClass(column)}`}
                        style={getResolvedColumnStyle(
                          column,
                          activeColumnSizing,
                          activeColumnPinning,
                          pinnedColumnOffsets,
                        )}
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
                ))}
                {virtualRange.bottomSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={emptyColumnSpan}
                      style={{
                        height: `${virtualRange.bottomSpacerHeight}px`,
                        padding: 0,
                      }}
                    />
                  </tr>
                ) : null}
              </>
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
              {firstVisibleRowNumber}-{lastVisibleRowNumber} of {totalRowCount}
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


function getVirtualRange({
  enabled,
  overscan,
  rowCount,
  rowHeight,
  scrollTop,
  viewportHeight,
}: {
  enabled: boolean;
  overscan: number;
  rowCount: number;
  rowHeight: number;
  scrollTop: number;
  viewportHeight: number;
}) {
  if (!enabled || rowCount === 0) {
    return {
      bottomSpacerHeight: 0,
      endIndex: rowCount,
      startIndex: 0,
      topSpacerHeight: 0,
    };
  }

  const safeRowHeight = Math.max(1, rowHeight);
  const safeOverscan = Math.max(0, overscan);
  const safeViewportHeight = Math.max(safeRowHeight, viewportHeight);
  const visibleRowCount = Math.ceil(safeViewportHeight / safeRowHeight);
  const renderedRowCount = visibleRowCount + safeOverscan * 2;
  const maxStartIndex = Math.max(0, rowCount - renderedRowCount);
  const startIndex = Math.min(
    maxStartIndex,
    Math.max(0, Math.floor(scrollTop / safeRowHeight) - safeOverscan),
  );
  const endIndex = Math.min(rowCount, startIndex + renderedRowCount);

  return {
    bottomSpacerHeight: Math.max(0, rowCount - endIndex) * safeRowHeight,
    endIndex,
    startIndex,
    topSpacerHeight: startIndex * safeRowHeight,
  };
}

function ColumnMenu<T>({
  canHide,
  column,
  enableColumnResizing,
  isPinnedLeft,
  isPinnedRight,
  onClearSort,
  onHideColumn,
  onPinLeft,
  onPinRight,
  onResetWidth,
  onSortAscending,
  onSortDescending,
  onUnpin,
}: {
  canHide: boolean;
  column: Column<T>;
  enableColumnResizing: boolean;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
  onClearSort: () => void;
  onHideColumn: () => void;
  onPinLeft: () => void;
  onPinRight: () => void;
  onResetWidth: () => void;
  onSortAscending: () => void;
  onSortDescending: () => void;
  onUnpin: () => void;
}) {
  return (
    <div
      aria-label={`${getColumnHeaderLabel(column)} column actions`}
      className="absolute right-2 top-10 z-20 min-w-40 rounded-md border border-gray-200 bg-white py-1 text-left text-sm font-normal text-gray-700 shadow-lg"
      role="menu"
    >
      {column.sortable ? (
        <>
          <ColumnMenuItem onClick={onSortAscending}>Sort ascending</ColumnMenuItem>
          <ColumnMenuItem onClick={onSortDescending}>Sort descending</ColumnMenuItem>
          <ColumnMenuItem onClick={onClearSort}>Clear sort</ColumnMenuItem>
        </>
      ) : null}
      <ColumnMenuItem disabled={!canHide} onClick={onHideColumn}>
        Hide column
      </ColumnMenuItem>
      <ColumnMenuItem disabled={isPinnedLeft} onClick={onPinLeft}>
        Pin left
      </ColumnMenuItem>
      <ColumnMenuItem disabled={isPinnedRight} onClick={onPinRight}>
        Pin right
      </ColumnMenuItem>
      <ColumnMenuItem
        disabled={!isPinnedLeft && !isPinnedRight}
        onClick={onUnpin}
      >
        Unpin
      </ColumnMenuItem>
      {enableColumnResizing ? (
        <ColumnMenuItem onClick={onResetWidth}>Reset width</ColumnMenuItem>
      ) : null}
    </div>
  );
}

function ColumnMenuItem({
  children,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      role="menuitem"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function getResolvedColumnStyle<T>(
  column: Column<T>,
  columnSizing: ColumnSizingState,
  columnPinning: ColumnPinningState,
  pinnedColumnOffsets: Record<string, number>,
): CSSProperties | undefined {
  const columnId = getColumnId(column);
  const sizedWidth = columnSizing[columnId];

  const style: CSSProperties = {
    ...getColumnStyle(column),
  };

  if (typeof sizedWidth === "number") {
    style.width = `${sizedWidth}px`;
  }

  if (columnPinning.left.includes(columnId)) {
    style.left = `${pinnedColumnOffsets[columnId] ?? 0}px`;
    style.position = "sticky";
    style.zIndex = 1;
    style.background = "inherit";
  }

  if (columnPinning.right.includes(columnId)) {
    style.right = `${pinnedColumnOffsets[columnId] ?? 0}px`;
    style.position = "sticky";
    style.zIndex = 1;
    style.background = "inherit";
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function getPinnedColumnOffsets<T>(
  columns: Column<T>[],
  columnPinning: ColumnPinningState,
  columnSizing: ColumnSizingState,
  minColumnWidth: number,
) {
  const offsets: Record<string, number> = {};
  let leftOffset = 0;

  columns.forEach((column) => {
    const columnId = getColumnId(column);

    if (columnPinning.left.includes(columnId)) {
      offsets[columnId] = leftOffset;
      leftOffset += getResolvedColumnWidth(column, columnSizing, minColumnWidth);
    }
  });

  let rightOffset = 0;

  [...columns].reverse().forEach((column) => {
    const columnId = getColumnId(column);

    if (columnPinning.right.includes(columnId)) {
      offsets[columnId] = rightOffset;
      rightOffset += getResolvedColumnWidth(column, columnSizing, minColumnWidth);
    }
  });

  return offsets;
}

function getResolvedColumnWidth<T>(
  column: Column<T>,
  columnSizing: ColumnSizingState,
  minColumnWidth: number,
) {
  const columnId = getColumnId(column);
  const sizedWidth = columnSizing[columnId];

  if (typeof sizedWidth === "number") {
    return sizedWidth;
  }

  if (typeof column.width === "number") {
    return column.width;
  }

  return minColumnWidth;
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

function getSortIndicator(columnId: string, sort: SortState[]) {
  const sortIndex = sort.findIndex((item) => item.columnId === columnId);

  if (sortIndex === -1) {
    return "-";
  }

  const direction = sort[sortIndex].direction === "asc" ? "ASC" : "DESC";

  return sort.length > 1 ? `${direction} ${sortIndex + 1}` : direction;
}

function getSortButtonLabel<T>(column: Column<T>, sort: SortState[]) {
  const columnId = getColumnId(column);
  const headerLabel = getColumnHeaderLabel(column);
  const activeSort = sort.find((item) => item.columnId === columnId);

  if (!activeSort) {
    return `Sort by ${headerLabel} ascending`;
  }

  if (activeSort.direction === "asc") {
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

function getAriaSort(columnId: string, sort: SortState[]) {
  const activeSort = sort.find((item) => item.columnId === columnId);

  if (!activeSort) {
    return "none";
  }

  return activeSort.direction === "asc" ? "ascending" : "descending";
}






