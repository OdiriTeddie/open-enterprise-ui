import type {
  FileManagerItem,
  FileManagerItemId,
  FileManagerSortState,
} from "./types";

export function filterFileManagerItems(
  items: FileManagerItem[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    [item.name, item.extension, item.path, item.type]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
  );
}

export function sortFileManagerItems(
  items: FileManagerItem[],
  sort: FileManagerSortState,
) {
  return [...items].sort((firstItem, secondItem) => {
    if (firstItem.type !== secondItem.type) {
      return firstItem.type === "folder" ? -1 : 1;
    }

    const comparison = compareValues(
      getSortValue(firstItem, sort.key),
      getSortValue(secondItem, sort.key),
    );

    return sort.direction === "asc" ? comparison : comparison * -1;
  });
}

export function toggleSelection(
  selectedIds: FileManagerItemId[],
  itemId: FileManagerItemId,
) {
  return selectedIds.includes(itemId)
    ? selectedIds.filter((selectedId) => selectedId !== itemId)
    : [...selectedIds, itemId];
}

export function formatFileSize(size?: number) {
  if (size === undefined) {
    return "--";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let nextSize = size / 1024;
  let unitIndex = 0;

  while (nextSize >= 1024 && unitIndex < units.length - 1) {
    nextSize /= 1024;
    unitIndex += 1;
  }

  return `${nextSize.toFixed(nextSize >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatFileDate(date?: Date | string) {
  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getSortValue(item: FileManagerItem, key: FileManagerSortState["key"]) {
  if (key === "size") {
    return item.type === "folder" ? -1 : item.size ?? 0;
  }

  if (key === "modifiedAt") {
    return item.modifiedAt ? new Date(item.modifiedAt).getTime() : 0;
  }

  if (key === "type") {
    return item.extension ?? item.type;
  }

  return item.name;
}

function compareValues(firstValue: string | number, secondValue: string | number) {
  if (typeof firstValue === "number" && typeof secondValue === "number") {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

