import { useEffect, useMemo, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import type { TreeListProps, TreeListRowId } from "./types";
import {
  buildTreeListNodes,
  findTreeListNode,
  flattenVisibleTreeListRows,
  getTreeListAlignClass,
  getTreeListColumnId,
  getTreeListColumnStyle,
  getTreeListColumnValue,
  getTreeListNodeDescendantIds,
  getTreeListSelectionState,
} from "./utils";

const TREE_INDENT_WIDTH = 24;

export function TreeList<T>({
  ariaLabel = "Tree list",
  columns,
  data,
  defaultExpandedRowIds = [],
  defaultSelectedRowIds = [],
  emptyMessage = "No rows found.",
  enableCascadeSelection = false,
  expandedRowIds,
  getParentId,
  getRowId,
  onExpandedRowIdsChange,
  onSelectedRowIdsChange,
  renderEmpty,
  selectedRowIds,
  selectionMode = "none",
}: TreeListProps<T>) {
  const [internalExpandedRowIds, setInternalExpandedRowIds] = useState<TreeListRowId[]>(defaultExpandedRowIds);
  const [internalSelectedRowIds, setInternalSelectedRowIds] = useState<TreeListRowId[]>(defaultSelectedRowIds);
  const activeExpandedRowIds = expandedRowIds === undefined ? internalExpandedRowIds : expandedRowIds;
  const activeSelectedRowIds = selectedRowIds === undefined ? internalSelectedRowIds : selectedRowIds;
  const treeNodes = useMemo(
    () => buildTreeListNodes({ data, getParentId, getRowId }),
    [data, getParentId, getRowId],
  );
  const visibleRows = useMemo(
    () => flattenVisibleTreeListRows(treeNodes, activeExpandedRowIds),
    [activeExpandedRowIds, treeNodes],
  );
  const selectedRowIdSet = useMemo(() => new Set(activeSelectedRowIds), [activeSelectedRowIds]);
  const isSelectionEnabled = selectionMode !== "none";
  const columnSpan = columns.length + (isSelectionEnabled ? 1 : 0);

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

  function toggleRow(rowId: TreeListRowId) {
    const isExpanded = activeExpandedRowIds.includes(rowId);
    const nextExpandedRowIds = isExpanded
      ? activeExpandedRowIds.filter((expandedRowId) => expandedRowId !== rowId)
      : [...activeExpandedRowIds, rowId];

    setExpandedRowIds(nextExpandedRowIds);
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

  function renderCellContent(row: T, column: typeof columns[number], rowIndex: number, depth: number, hasChildren: boolean, isExpanded: boolean): ReactNode {
    const value = getTreeListColumnValue(column, row);

    if (column.cell) {
      return column.cell({
        column,
        depth,
        hasChildren,
        isExpanded,
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
      <div className="overflow-auto">
        <table aria-label={ariaLabel} className="min-w-full border-collapse text-sm" role="treegrid">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              {isSelectionEnabled ? (
                <th className="w-12 border-b border-gray-200 px-4 py-3" scope="col">
                  <span className="sr-only">Select row</span>
                </th>
              ) : null}
              {columns.map((column, columnIndex) => (
                <th
                  className={`border-b border-gray-200 px-4 py-3 ${getTreeListAlignClass(column)}`}
                  key={getTreeListColumnId(column, columnIndex)}
                  scope="col"
                  style={getTreeListColumnStyle(column)}
                >
                  {column.header}
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
                  <tr
                    aria-expanded={visibleRow.hasChildren ? visibleRow.isExpanded : undefined}
                    aria-level={visibleRow.depth + 1}
                    aria-selected={isSelectionEnabled ? selectedRowIdSet.has(visibleRow.id) : undefined}
                    className="hover:bg-gray-50"
                    key={visibleRow.id}
                  >
                    {isSelectionEnabled ? (
                      <td className="px-4 py-3 align-middle">
                        <IndeterminateCheckbox
                          aria-label={`Select row ${visibleRow.id}`}
                          checked={selectionState.checked}
                          indeterminate={selectionState.indeterminate}
                          onChange={() => toggleSelection(visibleRow.id)}
                        />
                      </td>
                    ) : null}
                    {columns.map((column, columnIndex) => {
                      const isTreeColumn = columnIndex === 0;

                      return (
                        <td
                          className={`px-4 py-3 align-middle ${getTreeListAlignClass(column)}`}
                          key={getTreeListColumnId(column, columnIndex)}
                          style={getTreeListColumnStyle(column)}
                        >
                          {isTreeColumn ? (
                            <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: visibleRow.depth * TREE_INDENT_WIDTH }}>
                              {visibleRow.hasChildren ? (
                                <button
                                  aria-label={`${visibleRow.isExpanded ? "Collapse" : "Expand"} row`}
                                  aria-expanded={visibleRow.isExpanded}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                  onClick={() => toggleRow(visibleRow.id)}
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
