import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { InputHTMLAttributes, KeyboardEvent, ReactNode } from "react";
import type { TreeListColumnPinningState, TreeListColumnSizingState, TreeListFilterState, TreeListProps, TreeListRowId, TreeListSortState } from "./types";
import {
  buildTreeListNodes,
  findTreeListNode,
  filterTreeListNodes,
  flattenVisibleTreeListRows,
  getTreeListAlignClass,
  getTreeListColumnId,
  getTreeListResolvedColumnStyle,
  getTreeListColumnValue,
  getNextTreeListSortState,
  getTreeListNodeDescendantIds,
  getTreeListSelectionState,
  filterVisibleTreeListColumns,
  orderTreeListColumns,
  pinTreeListColumns,
  sortTreeListNodes,
} from "./utils";

const TREE_INDENT_WIDTH = 24;
const DEFAULT_FILTER: TreeListFilterState = { global: "" };
const DEFAULT_COLUMN_PINNING: TreeListColumnPinningState = { left: [], right: [] };
const DEFAULT_MIN_COLUMN_WIDTH = 80;
const COLUMN_RESIZE_KEYBOARD_STEP = 10;

export function TreeList<T>({
  ariaLabel = "Tree list",
  columns,
  data,
  columnOrder,
  columnPinning,
  columnSizing,
  columnVisibility,
  defaultColumnOrder = [],
  defaultColumnPinning = DEFAULT_COLUMN_PINNING,
  defaultColumnSizing = {},
  defaultColumnVisibility = {},
  defaultExpandedRowIds = [],
  defaultFilter = DEFAULT_FILTER,
  defaultSort = null,
  defaultSelectedRowIds = [],
  emptyMessage = "No rows found.",
  errorMessage = "Unable to load rows.",
  enableCascadeSelection = false,
  enableColumnResizing = false,
  expandedRowIds,
  filter,
  filterMode = "include-ancestors",
  globalFilterPlaceholder = "Search rows...",
  getParentId,
  getRowId,
  isRowExpandable,
  loadChildren,
  loadingRowIds,
  onColumnSizingChange,
  onExpandedRowIdsChange,
  onError,
  onFilterChange,
  onRowCollapse,
  onRowExpand,
  onSelectedRowIdsChange,
  onSortChange,
  renderEmpty,
  renderLoadingRow,
  minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
  selectedRowIds,
  selectionMode = "none",
  showGlobalFilter = true,
  sort,
}: TreeListProps<T>) {
  const [internalExpandedRowIds, setInternalExpandedRowIds] = useState<TreeListRowId[]>(defaultExpandedRowIds);
  const [internalSelectedRowIds, setInternalSelectedRowIds] = useState<TreeListRowId[]>(defaultSelectedRowIds);
  const [internalFilter, setInternalFilter] = useState<TreeListFilterState>(defaultFilter);
  const [internalSort, setInternalSort] = useState<TreeListSortState | null>(defaultSort);
  const [internalColumnSizing, setInternalColumnSizing] = useState<TreeListColumnSizingState>(defaultColumnSizing);
  const [internalColumnOrder] = useState(defaultColumnOrder);
  const [internalColumnVisibility] = useState(defaultColumnVisibility);
  const [internalColumnPinning] = useState(defaultColumnPinning);
  const [loadedChildren, setLoadedChildren] = useState<T[]>([]);
  const [internalLoadingRowIds, setInternalLoadingRowIds] = useState<TreeListRowId[]>([]);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [focusedRowId, setFocusedRowId] = useState<TreeListRowId | null>(null);
  const activeExpandedRowIds = expandedRowIds === undefined ? internalExpandedRowIds : expandedRowIds;
  const activeSelectedRowIds = selectedRowIds === undefined ? internalSelectedRowIds : selectedRowIds;
  const activeFilter = filter === undefined ? internalFilter : filter;
  const activeSort = sort === undefined ? internalSort : sort;
  const activeColumnSizing = columnSizing === undefined ? internalColumnSizing : columnSizing;
  const activeColumnOrder = columnOrder === undefined ? internalColumnOrder : columnOrder;
  const activeColumnVisibility = columnVisibility === undefined ? internalColumnVisibility : columnVisibility;
  const activeColumnPinning = columnPinning === undefined ? internalColumnPinning : columnPinning;
  const activeLoadingRowIds = loadingRowIds === undefined ? internalLoadingRowIds : loadingRowIds;
  const mergedData = useMemo(() => [...data, ...loadedChildren], [data, loadedChildren]);
  const orderedColumns = useMemo(() => orderTreeListColumns(columns, activeColumnOrder), [activeColumnOrder, columns]);
  const visibleColumns = useMemo(() => filterVisibleTreeListColumns(orderedColumns, activeColumnVisibility), [activeColumnVisibility, orderedColumns]);
  const renderedColumns = useMemo(() => pinTreeListColumns(visibleColumns, activeColumnPinning), [activeColumnPinning, visibleColumns]);
  const treeNodes = useMemo(
    () => buildTreeListNodes({ data: mergedData, getParentId, getRowId }),
    [mergedData, getParentId, getRowId],
  );
  const processedTreeNodes = useMemo(
    () => filterTreeListNodes(sortTreeListNodes(treeNodes, renderedColumns, activeSort), renderedColumns, activeFilter, filterMode),
    [activeFilter, activeSort, renderedColumns, filterMode, treeNodes],
  );
  const visibleRows = useMemo(
    () => flattenVisibleTreeListRows(processedTreeNodes, activeExpandedRowIds, {
      isRowExpandable,
      loadingRowIds: activeLoadingRowIds,
    }),
    [activeExpandedRowIds, activeLoadingRowIds, isRowExpandable, processedTreeNodes],
  );
  const selectedRowIdSet = useMemo(() => new Set(activeSelectedRowIds), [activeSelectedRowIds]);
  const isSelectionEnabled = selectionMode !== "none";
  const columnSpan = renderedColumns.length + (isSelectionEnabled ? 1 : 0);
  const focusedVisibleRowId = focusedRowId && visibleRows.some((row) => row.id === focusedRowId) ? focusedRowId : visibleRows[0]?.id;

  function setExpandedRowIds(nextExpandedRowIds: TreeListRowId[]) {
    if (expandedRowIds === undefined) {
      setInternalExpandedRowIds(nextExpandedRowIds);
    }

    onExpandedRowIdsChange?.(nextExpandedRowIds);
  }

  function setSelectedRowIds(nextSelectedRowIds: TreeListRowId[]) {
    if (selectedRowIds === undefined) {
      setInternalSelectedRowIds(nextSelectedRowIds);
    }

    onSelectedRowIdsChange?.(nextSelectedRowIds);
  }

  function setFilterState(nextFilter: TreeListFilterState) {
    if (filter === undefined) {
      setInternalFilter(nextFilter);
    }

    onFilterChange?.(nextFilter);
  }

  function setColumnSizingState(nextColumnSizing: TreeListColumnSizingState) {
    if (columnSizing === undefined) {
      setInternalColumnSizing(nextColumnSizing);
    }

    onColumnSizingChange?.(nextColumnSizing);
  }

  function resizeColumn(columnId: string, nextWidth: number) {
    setColumnSizingState({
      ...activeColumnSizing,
      [columnId]: Math.max(nextWidth, minColumnWidth),
    });
  }

  function setSortState(nextSort: TreeListSortState | null) {
    if (sort === undefined) {
      setInternalSort(nextSort);
    }

    onSortChange?.(nextSort);
  }

  function setLoadingRowIds(nextLoadingRowIds: TreeListRowId[]) {
    if (loadingRowIds === undefined) {
      setInternalLoadingRowIds(nextLoadingRowIds);
    }
  }

  async function toggleRow(rowId: TreeListRowId, row: T) {
    const isExpanded = activeExpandedRowIds.includes(rowId);

    if (isExpanded) {
      setExpandedRowIds(activeExpandedRowIds.filter((expandedRowId) => expandedRowId !== rowId));
      onRowCollapse?.(row);
      return;
    }

    setExpandedRowIds([...activeExpandedRowIds, rowId]);
    onRowExpand?.(row);

    if (!loadChildren) {
      return;
    }

    const node = findTreeListNode(treeNodes, rowId);

    if (node && node.children.length > 0) {
      return;
    }

    setLoadError(null);
    setLoadingRowIds([...activeLoadingRowIds, rowId]);

    try {
      const children = await loadChildren(row);

      setLoadedChildren((currentChildren) => {
        const existingIds = new Set([...data, ...currentChildren].map((item, index) => getRowId(item, index)));
        return [...currentChildren, ...children.filter((child, index) => !existingIds.has(getRowId(child, data.length + currentChildren.length + index)))];
      });
    } catch (error) {
      setLoadError(error);
      onError?.(error);
    } finally {
      setLoadingRowIds(activeLoadingRowIds.filter((loadingRowId) => loadingRowId !== rowId));
    }
  }

  function toggleSelection(rowId: TreeListRowId) {
    if (selectionMode === "none") {
      return;
    }

    if (selectionMode === "single") {
      setSelectedRowIds(selectedRowIdSet.has(rowId) ? [] : [rowId]);
      return;
    }

    if (enableCascadeSelection) {
      const node = findTreeListNode(treeNodes, rowId);
      const cascadeIds = node ? [node.id, ...getTreeListNodeDescendantIds(node)] : [rowId];
      const shouldSelect = cascadeIds.some((id) => !selectedRowIdSet.has(id));
      const nextSelectedSet = new Set(activeSelectedRowIds);

      cascadeIds.forEach((id) => {
        if (shouldSelect) {
          nextSelectedSet.add(id);
        } else {
          nextSelectedSet.delete(id);
        }
      });

      setSelectedRowIds(Array.from(nextSelectedSet));
      return;
    }

    setSelectedRowIds(
      selectedRowIdSet.has(rowId)
        ? activeSelectedRowIds.filter((selectedRowId) => selectedRowId !== rowId)
        : [...activeSelectedRowIds, rowId],
    );
  }

  function getRowLabel(row: T, rowIndex: number) {
    const firstColumn = renderedColumns[0];

    if (!firstColumn) {
      return String(getRowId(row, rowIndex));
    }

    const value = getTreeListColumnValue(firstColumn, row);

    return value == null ? String(getRowId(row, rowIndex)) : String(value);
  }

  function focusVisibleRowByIndex(rowIndex: number) {
    const nextRow = visibleRows[rowIndex];

    if (nextRow) {
      setFocusedRowId(nextRow.id);
    }
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, rowIndex: number, rowId: TreeListRowId, row: T, hasChildren: boolean, isExpanded: boolean) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusVisibleRowByIndex(Math.min(rowIndex + 1, visibleRows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusVisibleRowByIndex(Math.max(rowIndex - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      focusVisibleRowByIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusVisibleRowByIndex(visibleRows.length - 1);
    } else if (event.key === "ArrowRight" && hasChildren && !isExpanded) {
      event.preventDefault();
      void toggleRow(rowId, row);
    } else if (event.key === "ArrowLeft" && hasChildren && isExpanded) {
      event.preventDefault();
      void toggleRow(rowId, row);
    } else if ((event.key === " " || event.key === "Enter") && isSelectionEnabled) {
      event.preventDefault();
      toggleSelection(rowId);
    }
  }

  function handleSortToggle(column: typeof columns[number], columnIndex: number) {
    if (!column.sortable) {
      return;
    }

    setSortState(getNextTreeListSortState(column, activeSort, columnIndex));
  }

  function renderCellContent(row: T, column: typeof columns[number], rowIndex: number, depth: number, hasChildren: boolean, isExpanded: boolean): ReactNode {
    const value = getTreeListColumnValue(column, row);

    if (column.cell) {
      return column.cell({
        column,
        depth,
        hasChildren,
        isExpanded,
        isLoading: activeLoadingRowIds.includes(getRowId(row, rowIndex)),
        row,
        rowIndex,
        value,
      });
    }

    if (column.render) {
      return column.render(row);
    }

    return value == null ? null : String(value);
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      {showGlobalFilter ? (
        <div className="border-b border-gray-200 p-4">
          <label className="sr-only" htmlFor={`${ariaLabel.replace(/\s+/g, "-").toLowerCase()}-search`}>Search rows</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 sm:max-w-xs"
            id={`${ariaLabel.replace(/\s+/g, "-").toLowerCase()}-search`}
            onChange={(event) => setFilterState({ global: event.target.value })}
            placeholder={globalFilterPlaceholder}
            type="search"
            value={activeFilter.global}
          />
        </div>
      ) : null}
      {loadError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      ) : null}
      <div className="overflow-auto">
        <table aria-label={ariaLabel} className="min-w-full border-collapse text-sm" role="treegrid">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              {isSelectionEnabled ? (
                <th className="w-12 border-b border-gray-200 px-4 py-3" scope="col">
                  <span className="sr-only">Select row</span>
                </th>
              ) : null}
              {renderedColumns.map((column, columnIndex) => (
                <th
                  className={`border-b border-gray-200 px-4 py-3 ${getTreeListAlignClass(column)}`}
                  key={getTreeListColumnId(column, columnIndex)}
                  aria-sort={activeSort?.columnId === getTreeListColumnId(column, columnIndex) ? (activeSort.direction === "asc" ? "ascending" : "descending") : undefined}
                  scope="col"
                  style={getTreeListResolvedColumnStyle(column, activeColumnSizing, minColumnWidth, columnIndex)}
                >
                  {!column.sortable ? (
                    column.header
                  ) : (
                    <button
                      aria-label={`Sort by ${String(column.header)}${activeSort?.columnId === getTreeListColumnId(column, columnIndex) ? `, ${activeSort.direction}` : ""}`}
                      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      onClick={() => handleSortToggle(column, columnIndex)}
                      type="button"
                    >
                      <span>{column.header}</span>
                      {activeSort?.columnId === getTreeListColumnId(column, columnIndex) ? (
                        <span aria-hidden="true">{activeSort.direction === "asc" ? "ASC" : "DESC"}</span>
                      ) : null}
                    </button>
                  )}
                  {enableColumnResizing ? (
                    <button
                      aria-label={`Resize ${String(column.header)} column`}
                      className="ml-2 inline-flex h-5 w-2 cursor-col-resize items-center justify-center rounded-sm border border-transparent text-gray-400 hover:border-gray-300 focus:border-gray-400 focus:outline-none"
                      onKeyDown={(event) => {
                        const columnId = getTreeListColumnId(column, columnIndex);
                        const currentWidth = activeColumnSizing[columnId] ?? (typeof column.width === "number" ? column.width : minColumnWidth);

                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          resizeColumn(columnId, currentWidth - COLUMN_RESIZE_KEYBOARD_STEP);
                        } else if (event.key === "ArrowRight") {
                          event.preventDefault();
                          resizeColumn(columnId, currentWidth + COLUMN_RESIZE_KEYBOARD_STEP);
                        }
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">|</span>
                    </button>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-900">
            {visibleRows.length > 0 ? (
              visibleRows.map((visibleRow, rowIndex) => {
                const selectionNode = enableCascadeSelection ? findTreeListNode(treeNodes, visibleRow.id) : undefined;
                const selectionState = selectionNode
                  ? getTreeListSelectionState(selectionNode, activeSelectedRowIds)
                  : { checked: selectedRowIdSet.has(visibleRow.id), indeterminate: false };

                return (
                  <Fragment key={visibleRow.id}>
                  <tr
                    aria-expanded={visibleRow.hasChildren ? visibleRow.isExpanded : undefined}
                    aria-level={visibleRow.depth + 1}
                    aria-selected={isSelectionEnabled ? selectedRowIdSet.has(visibleRow.id) : undefined}
                    className="hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400"
                    onFocus={() => setFocusedRowId(visibleRow.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, rowIndex, visibleRow.id, visibleRow.row, visibleRow.hasChildren, visibleRow.isExpanded)}
                    tabIndex={visibleRow.id === focusedVisibleRowId ? 0 : -1}
                  >
                    {isSelectionEnabled ? (
                      <td className="px-4 py-3 align-middle">
                        <IndeterminateCheckbox
                          aria-label={`Select ${getRowLabel(visibleRow.row, rowIndex)}`}
                          checked={selectionState.checked}
                          indeterminate={selectionState.indeterminate}
                          onChange={() => toggleSelection(visibleRow.id)}
                        />
                      </td>
                    ) : null}
                    {renderedColumns.map((column, columnIndex) => {
                      const isTreeColumn = columnIndex === 0;

                      return (
                        <td
                          className={`px-4 py-3 align-middle ${getTreeListAlignClass(column)}`}
                          key={getTreeListColumnId(column, columnIndex)}
                          style={getTreeListResolvedColumnStyle(column, activeColumnSizing, minColumnWidth, columnIndex)}
                        >
                          {isTreeColumn ? (
                            <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: visibleRow.depth * TREE_INDENT_WIDTH }}>
                              {visibleRow.hasChildren ? (
                                <button
                                  aria-label={`${visibleRow.isExpanded ? "Collapse" : "Expand"} ${getRowLabel(visibleRow.row, rowIndex)}`}
                                  aria-expanded={visibleRow.isExpanded}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                  onClick={() => void toggleRow(visibleRow.id, visibleRow.row)}
                                  type="button"
                                >
                                  {visibleRow.isExpanded ? "-" : "+"}
                                </button>
                              ) : (
                                <span aria-hidden="true" className="h-6 w-6 shrink-0" />
                              )}
                              <span className="min-w-0 truncate">{renderCellContent(visibleRow.row, column, rowIndex, visibleRow.depth, visibleRow.hasChildren, visibleRow.isExpanded)}</span>
                            </div>
                          ) : (
                            renderCellContent(visibleRow.row, column, rowIndex, visibleRow.depth, visibleRow.hasChildren, visibleRow.isExpanded)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {visibleRow.isExpanded && visibleRow.isLoading ? (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-500" colSpan={columnSpan}>
                        <div style={{ paddingLeft: (visibleRow.depth + 1) * TREE_INDENT_WIDTH }}>
                          {renderLoadingRow ? renderLoadingRow(visibleRow.row) : "Loading rows..."}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={columnSpan}>
                  {renderEmpty ? renderEmpty() : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndeterminateCheckbox({ indeterminate, ...props }: InputHTMLAttributes<HTMLInputElement> & { indeterminate: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
      ref={inputRef}
      type="checkbox"
      {...props}
    />
  );
}
