import type { CSSProperties } from "react";
import type { TreeListColumn, TreeListNode, TreeListRowId, TreeListVisibleRow } from "./types";

export function getTreeListColumnId<T>(column: TreeListColumn<T>, index = 0) {
  return String(column.id ?? column.accessorKey ?? column.key ?? `column-${index}`);
}

export function getTreeListColumnValue<T, TValue>(column: TreeListColumn<T, TValue>, row: T): TValue | undefined {
  if (column.accessorFn) {
    return column.accessorFn(row);
  }

  const key = column.accessorKey ?? column.key;

  if (key) {
    return row[key as keyof T] as TValue;
  }

  return undefined;
}

export function getTreeListColumnStyle<T>(column: TreeListColumn<T>): CSSProperties | undefined {
  if (column.width === undefined) {
    return undefined;
  }

  return {
    width: typeof column.width === "number" ? `${column.width}px` : column.width,
  };
}

export function getTreeListAlignClass<T>(column: TreeListColumn<T>) {
  if (column.align === "center") {
    return "text-center";
  }

  if (column.align === "right") {
    return "text-right";
  }

  return "text-left";
}

export function buildTreeListNodes<T>({
  data,
  getParentId,
  getRowId,
}: {
  data: T[];
  getParentId?: (row: T) => TreeListRowId | null | undefined;
  getRowId: (row: T, index: number) => TreeListRowId;
}) {
  const nodeById = new Map<TreeListRowId, TreeListNode<T>>();
  const orderedNodes: TreeListNode<T>[] = [];

  data.forEach((row, index) => {
    const id = getRowId(row, index);
    const parentId = normalizeParentId(getParentId?.(row));
    const node: TreeListNode<T> = {
      children: [],
      depth: 0,
      id,
      parentId,
      row,
    };

    nodeById.set(id, node);
    orderedNodes.push(node);
  });

  const rootNodes: TreeListNode<T>[] = [];

  orderedNodes.forEach((node) => {
    if (node.parentId !== null && nodeById.has(node.parentId)) {
      nodeById.get(node.parentId)?.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  rootNodes.forEach((node) => assignDepth(node, 0));

  return rootNodes;
}

export function flattenVisibleTreeListRows<T>(
  nodes: TreeListNode<T>[],
  expandedRowIds: TreeListRowId[],
): TreeListVisibleRow<T>[] {
  const expandedSet = new Set(expandedRowIds);
  const rows: TreeListVisibleRow<T>[] = [];

  function visit(node: TreeListNode<T>) {
    const hasChildren = node.children.length > 0;
    const isExpanded = hasChildren && expandedSet.has(node.id);

    rows.push({
      depth: node.depth,
      hasChildren,
      id: node.id,
      isExpanded,
      parentId: node.parentId,
      row: node.row,
    });

    if (isExpanded) {
      node.children.forEach(visit);
    }
  }

  nodes.forEach(visit);

  return rows;
}

function assignDepth<T>(node: TreeListNode<T>, depth: number) {
  node.depth = depth;
  node.children.forEach((child) => assignDepth(child, depth + 1));
}

function normalizeParentId(parentId: TreeListRowId | null | undefined) {
  return parentId === undefined ? null : parentId;
}
