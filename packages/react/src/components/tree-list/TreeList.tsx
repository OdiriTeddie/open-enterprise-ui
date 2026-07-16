import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TreeListProps, TreeListRowId } from "./types";
import {
  buildTreeListNodes,
  flattenVisibleTreeListRows,
  getTreeListAlignClass,
  getTreeListColumnId,
  getTreeListColumnStyle,
  getTreeListColumnValue,
} from "./utils";

const TREE_INDENT_WIDTH = 24;

export function TreeList<T>({
  ariaLabel = "Tree list",
  columns,
  data,
  defaultExpandedRowIds = [],
  emptyMessage = "No rows found.",
  expandedRowIds,
  getParentId,
  getRowId,
  onExpandedRowIdsChange,
  renderEmpty,
}: TreeListProps<T>) {
  const [internalExpandedRowIds, setInternalExpandedRowIds] = useState<TreeListRowId[]>(defaultExpandedRowIds);
  const activeExpandedRowIds = expandedRowIds === undefined ? internalExpandedRowIds : expandedRowIds;
  const treeNodes = useMemo(
    () => buildTreeListNodes({ data, getParentId, getRowId }),
    [data, getParentId, getRowId],
  );
  const visibleRows = useMemo(
    () => flattenVisibleTreeListRows(treeNodes, activeExpandedRowIds),
    [activeExpandedRowIds, treeNodes],
  );

  function setExpandedRowIds(nextExpandedRowIds: TreeListRowId[]) {
    if (expandedRowIds === undefined) {
      setInternalExpandedRowIds(nextExpandedRowIds);
    }

    onExpandedRowIdsChange?.(nextExpandedRowIds);
  }

  function toggleRow(rowId: TreeListRowId) {
    const isExpanded = activeExpandedRowIds.includes(rowId);
    const nextExpandedRowIds = isExpanded
      ? activeExpandedRowIds.filter((expandedRowId) => expandedRowId !== rowId)
      : [...activeExpandedRowIds, rowId];

    setExpandedRowIds(nextExpandedRowIds);
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
              visibleRows.map((visibleRow, rowIndex) => (
                <tr
                  aria-expanded={visibleRow.hasChildren ? visibleRow.isExpanded : undefined}
                  aria-level={visibleRow.depth + 1}
                  className="hover:bg-gray-50"
                  key={visibleRow.id}
                >
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
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={columns.length}>
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
