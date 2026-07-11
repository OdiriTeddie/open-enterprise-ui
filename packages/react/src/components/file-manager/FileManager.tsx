import { useEffect, useId, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import type {
  FileManagerBreadcrumb,
  FileManagerContextMenuItem,
  FileManagerItem,
  FileManagerItemId,
  FileManagerProps,
  FileManagerSortKey,
  FileManagerSortState,
  FileManagerViewMode,
} from "./types";
import {
  filterFileManagerItems,
  formatFileDate,
  formatFileSize,
  sortFileManagerItems,
  toggleSelection,
} from "./utils";

const defaultBreadcrumbs: FileManagerBreadcrumb[] = [{ label: "Home" }];

const sortOptions: Array<{ label: string; value: FileManagerSortKey }> = [
  { label: "Name", value: "name" },
  { label: "Type", value: "type" },
  { label: "Size", value: "size" },
  { label: "Modified", value: "modifiedAt" },
];

type ActiveContextMenu = {
  item: FileManagerItem;
  x?: number;
  y?: number;
};

export function FileManager({
  ariaLabel = "File manager",
  breadcrumbs = defaultBreadcrumbs,
  className = "",
  contextMenuItems = [],
  dataProvider,
  defaultFolderId,
  defaultSelectedIds = [],
  defaultSort = { direction: "asc", key: "name" },
  defaultViewMode = "list",
  emptyMessage = "No files or folders.",
  errorMessage = "Unable to load files.",
  getItemId = (item) => item.id,
  items = [],
  loading = false,
  noResultsMessage = "No files match your search.",
  onBreadcrumbClick,
  onContextMenuOpen,
  onCreateFolder,
  onDelete,
  onDownload,
  onError,
  onFolderChange,
  onItemOpen,
  onSearchChange,
  onSelectionChange,
  onSortChange,
  onUpload,
  onViewModeChange,
  renderEmpty,
  renderError,
  renderLoading,
  searchPlaceholder = "Search files...",
  searchValue,
  selectedIds,
  sort,
  viewMode,
}: FileManagerProps) {
  const searchInputId = useId();
  const [currentFolderId, setCurrentFolderId] = useState<FileManagerItemId | undefined>(defaultFolderId);
  const [internalSearch, setInternalSearch] = useState("");
  const [internalSelectedIds, setInternalSelectedIds] = useState<FileManagerItemId[]>(defaultSelectedIds);
  const [internalSort, setInternalSort] = useState<FileManagerSortState>(defaultSort);
  const [internalViewMode, setInternalViewMode] = useState<FileManagerViewMode>(defaultViewMode);
  const [providerItems, setProviderItems] = useState<FileManagerItem[]>([]);
  const [providerBreadcrumbs, setProviderBreadcrumbs] = useState<FileManagerBreadcrumb[]>(breadcrumbs);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState<unknown>();
  const [reloadKey, setReloadKey] = useState(0);
  const [activeContextMenu, setActiveContextMenu] = useState<ActiveContextMenu | null>(null);

  useEffect(() => {
    if (!dataProvider) {
      return;
    }

    let isCurrent = true;

    Promise.resolve()
      .then(() => {
        if (!isCurrent) {
          return undefined;
        }

        setProviderLoading(true);
        setProviderError(undefined);
        return dataProvider.loadFolder(currentFolderId);
      })
      .then((result) => {
        if (!isCurrent || !result) {
          return;
        }

        setProviderItems(result.items);
        setProviderBreadcrumbs(result.breadcrumbs ?? breadcrumbs);
        setInternalSelectedIds([]);
        setActiveContextMenu(null);
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setProviderError(error);
        onError?.(error);
      })
      .finally(() => {
        if (isCurrent) {
          setProviderLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [breadcrumbs, currentFolderId, dataProvider, onError, reloadKey]);

  const effectiveItems = dataProvider ? providerItems : items;
  const effectiveBreadcrumbs = dataProvider ? providerBreadcrumbs : breadcrumbs;
  const effectiveLoading = loading || providerLoading;
  const currentSearch = searchValue ?? internalSearch;
  const currentSelectedIds = selectedIds ?? internalSelectedIds;
  const currentSort = sort ?? internalSort;
  const currentViewMode = viewMode ?? internalViewMode;

  const visibleItems = useMemo(
    () => sortFileManagerItems(filterFileManagerItems(effectiveItems, currentSearch), currentSort),
    [currentSearch, currentSort, effectiveItems],
  );

  const selectedItems = useMemo(
    () => effectiveItems.filter((item) => currentSelectedIds.includes(getItemId(item))),
    [currentSelectedIds, effectiveItems, getItemId],
  );

  const hasSearch = currentSearch.trim().length > 0;
  const isEmpty = effectiveItems.length === 0;
  const hasNoResults = effectiveItems.length > 0 && visibleItems.length === 0;
  const canCreateFolder = Boolean(onCreateFolder || dataProvider?.createFolder);
  const canDelete = Boolean(onDelete || dataProvider?.deleteItems);
  const canDownload = Boolean(onDownload || dataProvider?.downloadItems);
  const canUpload = Boolean(onUpload || dataProvider?.uploadFiles);

  const builtInContextMenuItems: Array<FileManagerContextMenuItem> = [
      {
        id: "open",
        label: "Open",
        onSelect: (item) => handleItemOpen(item),
      },
      {
        disabled: (item) => item.type === "folder" || !canDownload,
        id: "download",
        label: "Download",
        onSelect: (item) => handleDownloadItems([item]),
      },
      {
        danger: true,
        disabled: !canDelete,
        id: "delete",
        label: "Delete",
        onSelect: (item) => handleDeleteItems([item]),
      },
    ];
  const activeContextMenuItems = [...builtInContextMenuItems, ...contextMenuItems];

  function refreshProvider() {
    if (dataProvider) {
      setReloadKey((currentKey) => currentKey + 1);
    }
  }

  async function runProviderAction(action: () => void | Promise<void>) {
    try {
      setProviderError(undefined);
      await action();
      refreshProvider();
    } catch (error) {
      setProviderError(error);
      onError?.(error);
    }
  }

  function handleSearchChange(value: string) {
    if (searchValue === undefined) {
      setInternalSearch(value);
    }

    onSearchChange?.(value);
  }

  function handleSortKeyChange(key: FileManagerSortKey) {
    const nextSort = {
      ...currentSort,
      key,
    };

    if (sort === undefined) {
      setInternalSort(nextSort);
    }

    onSortChange?.(nextSort);
  }

  function handleSortDirectionToggle() {
    const nextSort: FileManagerSortState = {
      ...currentSort,
      direction: currentSort.direction === "asc" ? "desc" : "asc",
    };

    if (sort === undefined) {
      setInternalSort(nextSort);
    }

    onSortChange?.(nextSort);
  }

  function handleViewModeChange(nextViewMode: FileManagerViewMode) {
    if (viewMode === undefined) {
      setInternalViewMode(nextViewMode);
    }

    onViewModeChange?.(nextViewMode);
  }

  function handleSelectionToggle(item: FileManagerItem) {
    const itemId = getItemId(item);
    const nextSelectedIds = toggleSelection(currentSelectedIds, itemId);

    if (selectedIds === undefined) {
      setInternalSelectedIds(nextSelectedIds);
    }

    onSelectionChange?.({ item, selectedIds: nextSelectedIds });
  }

  function handleSelectAll() {
    const visibleIds = visibleItems.map(getItemId);
    const allVisibleSelected = visibleIds.every((itemId) => currentSelectedIds.includes(itemId));
    const nextSelectedIds = allVisibleSelected
      ? currentSelectedIds.filter((itemId) => !visibleIds.includes(itemId))
      : Array.from(new Set([...currentSelectedIds, ...visibleIds]));

    if (selectedIds === undefined) {
      setInternalSelectedIds(nextSelectedIds);
    }
  }

  function handleFolderChange(folderId?: FileManagerItemId) {
    setCurrentFolderId(folderId);
    setInternalSearch("");
    setInternalSelectedIds([]);
    setActiveContextMenu(null);
    onFolderChange?.(folderId);
  }

  function handleBreadcrumbClick(breadcrumb: FileManagerBreadcrumb, index: number) {
    onBreadcrumbClick?.(breadcrumb, index);

    if (dataProvider) {
      handleFolderChange(breadcrumb.id);
    }
  }

  function handleItemOpen(item: FileManagerItem) {
    setActiveContextMenu(null);

    if (item.type === "folder" && dataProvider) {
      handleFolderChange(getItemId(item));
      onItemOpen?.(item);
      return;
    }

    onItemOpen?.(item);

    if (dataProvider && item.type === "file" && dataProvider.openFile) {
      void runProviderAction(() => dataProvider.openFile?.(item, currentFolderId));
    }
  }

  function handleCreateFolder() {
    if (onCreateFolder) {
      onCreateFolder();
      return;
    }

    if (dataProvider?.createFolder) {
      void runProviderAction(() => dataProvider.createFolder?.(currentFolderId));
    }
  }

  function handleUpload() {
    if (onUpload) {
      onUpload();
      return;
    }

    if (dataProvider?.uploadFiles) {
      void runProviderAction(() => dataProvider.uploadFiles?.(currentFolderId));
    }
  }

  function handleDownloadItems(itemsToDownload: FileManagerItem[]) {
    setActiveContextMenu(null);

    if (onDownload) {
      onDownload(itemsToDownload);
      return;
    }

    if (dataProvider?.downloadItems) {
      void runProviderAction(() => dataProvider.downloadItems?.(itemsToDownload, currentFolderId));
    }
  }

  function handleDeleteItems(itemsToDelete: FileManagerItem[]) {
    setActiveContextMenu(null);

    if (onDelete) {
      onDelete(itemsToDelete);
      return;
    }

    if (dataProvider?.deleteItems) {
      void runProviderAction(() => dataProvider.deleteItems?.(itemsToDelete, currentFolderId));
    }
  }

  function handleContextMenuOpen(item: FileManagerItem, event?: MouseEvent) {
    event?.preventDefault();
    setActiveContextMenu({
      item,
      x: event?.clientX,
      y: event?.clientY,
    });
    onContextMenuOpen?.(item);
  }

  function isContextMenuItemDisabled(menuItem: FileManagerContextMenuItem, item: FileManagerItem) {
    return typeof menuItem.disabled === "function" ? menuItem.disabled(item) : Boolean(menuItem.disabled);
  }

  function handleContextMenuSelect(menuItem: FileManagerContextMenuItem, item: FileManagerItem) {
    if (isContextMenuItemDisabled(menuItem, item)) {
      return;
    }

    setActiveContextMenu(null);
    menuItem.onSelect(item);
  }

  function renderItemActions(item: FileManagerItem) {
    return (
      <button
        aria-label={`Open actions for ${item.name}`}
        className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        onClick={() => handleContextMenuOpen(item)}
        type="button"
      >
        Actions
      </button>
    );
  }

  function renderContent() {
    if (effectiveLoading) {
      return renderLoading ? renderLoading() : <FileManagerState label="Loading files..." />;
    }

    if (providerError) {
      return renderError ? renderError(providerError) : <FileManagerState label={errorMessage} />;
    }

    if (isEmpty) {
      return renderEmpty ? renderEmpty() : <FileManagerState label={emptyMessage} />;
    }

    if (hasNoResults) {
      return <FileManagerState label={noResultsMessage} />;
    }

    if (currentViewMode === "grid") {
      return (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleItems.map((item) => {
            const itemId = getItemId(item);
            const isSelected = currentSelectedIds.includes(itemId);

            return (
              <div
                className={`rounded-md border bg-white p-3 text-left transition ${
                  isSelected ? "border-gray-900 ring-2 ring-gray-200" : "border-gray-200 hover:border-gray-300"
                }`}
                key={itemId}
                onContextMenu={(event) => handleContextMenuOpen(item, event)}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span aria-hidden="true" className="text-xs font-semibold text-gray-500">{item.type === "folder" ? "DIR" : "FILE"}</span>
                  <div className="flex items-center gap-2">
                    {renderItemActions(item)}
                    <input
                      aria-label={`Select ${item.name}`}
                      checked={isSelected}
                      className="h-4 w-4 rounded border-gray-300"
                      onChange={() => handleSelectionToggle(item)}
                      type="checkbox"
                    />
                  </div>
                </div>
                <button
                  className="block w-full truncate text-left text-sm font-medium text-gray-900 hover:underline"
                  onClick={() => handleItemOpen(item)}
                  type="button"
                >
                  {item.name}
                </button>
                <div className="mt-2 text-xs text-gray-500">
                  {item.type === "folder" ? "Folder" : item.extension ?? "File"} - {formatFileSize(item.size)}
                </div>
                <div className="mt-1 text-xs text-gray-500">Modified {formatFileDate(item.modifiedAt)}</div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3" scope="col">
                <input
                  aria-label="Select all visible items"
                  checked={visibleItems.length > 0 && visibleItems.every((item) => currentSelectedIds.includes(getItemId(item)))}
                  className="h-4 w-4 rounded border-gray-300"
                  onChange={handleSelectAll}
                  type="checkbox"
                />
              </th>
              <th className="px-4 py-3" scope="col">Name</th>
              <th className="px-4 py-3" scope="col">Type</th>
              <th className="px-4 py-3" scope="col">Size</th>
              <th className="px-4 py-3" scope="col">Modified</th>
              <th className="w-24 px-4 py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visibleItems.map((item) => {
              const itemId = getItemId(item);
              const isSelected = currentSelectedIds.includes(itemId);

              return (
                <tr
                  className={isSelected ? "bg-gray-50" : undefined}
                  key={itemId}
                  onContextMenu={(event) => handleContextMenuOpen(item, event)}
                >
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Select ${item.name}`}
                      checked={isSelected}
                      className="h-4 w-4 rounded border-gray-300"
                      onChange={() => handleSelectionToggle(item)}
                      type="checkbox"
                    />
                  </td>
                  <td className="min-w-64 px-4 py-3">
                    <button
                      className="flex items-center gap-2 text-left font-medium text-gray-900 hover:underline"
                      onClick={() => handleItemOpen(item)}
                      type="button"
                    >
                      <span aria-hidden="true" className="text-xs font-semibold text-gray-500">{item.type === "folder" ? "DIR" : "FILE"}</span>
                      <span>{item.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.type === "folder" ? "Folder" : item.extension ?? "File"}</td>
                  <td className="px-4 py-3 text-gray-600">{formatFileSize(item.size)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatFileDate(item.modifiedAt)}</td>
                  <td className="px-4 py-3">{renderItemActions(item)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section aria-label={ariaLabel} className={`relative overflow-hidden rounded-md border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Folder path" className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
            {effectiveBreadcrumbs.map((breadcrumb, index) => (
              <span className="flex items-center gap-1" key={`${index}-${breadcrumb.path ?? String(breadcrumb.id ?? "root")}`}>
                {index > 0 ? <span aria-hidden="true" className="text-gray-400">/</span> : null}
                <button
                  className="rounded px-1.5 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-default disabled:text-gray-900"
                  disabled={index === effectiveBreadcrumbs.length - 1}
                  onClick={() => handleBreadcrumbClick(breadcrumb, index)}
                  type="button"
                >
                  {breadcrumb.label}
                </button>
              </span>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canCreateFolder || effectiveLoading} onClick={handleCreateFolder} type="button">
              New folder
            </button>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canUpload || effectiveLoading} onClick={handleUpload} type="button">
              Upload
            </button>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canDownload || selectedItems.length === 0 || effectiveLoading} onClick={() => handleDownloadItems(selectedItems)} type="button">
              Download
            </button>
            <button className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canDelete || selectedItems.length === 0 || effectiveLoading} onClick={() => handleDeleteItems(selectedItems)} type="button">
              Delete
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="sr-only" htmlFor={searchInputId}>Search files</label>
            <input
              className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              id={searchInputId}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              type="search"
              value={currentSearch}
            />
            {hasSearch ? <span className="text-xs text-gray-500">{visibleItems.length} found</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor={`${searchInputId}-sort`}>Sort</label>
            <select
              className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700"
              id={`${searchInputId}-sort`}
              onChange={(event) => handleSortKeyChange(event.target.value as FileManagerSortKey)}
              value={currentSort.key}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700" onClick={handleSortDirectionToggle} type="button">
              {currentSort.direction === "asc" ? "Ascending" : "Descending"}
            </button>
            <div aria-label="View mode" className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
              <button className={`px-3 py-2 text-sm ${currentViewMode === "list" ? "bg-gray-900 text-white" : "text-gray-700"}`} onClick={() => handleViewModeChange("list")} type="button">
                List
              </button>
              <button className={`px-3 py-2 text-sm ${currentViewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-700"}`} onClick={() => handleViewModeChange("grid")} type="button">
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {currentSelectedIds.length > 0 ? (
        <div className="border-b border-gray-200 bg-gray-900 px-4 py-2 text-sm text-white">
          {currentSelectedIds.length} selected
        </div>
      ) : null}

      {renderContent()}

      {activeContextMenu ? (
        <div className="fixed inset-0 z-40" onClick={() => setActiveContextMenu(null)}>
          <div
            aria-label={`Actions for ${activeContextMenu.item.name}`}
            className="absolute min-w-40 rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg"
            role="menu"
            style={{
              left: activeContextMenu.x ?? undefined,
              right: activeContextMenu.x === undefined ? 16 : undefined,
              top: activeContextMenu.y ?? 96,
            }}
          >
            {activeContextMenuItems.map((menuItem) => {
              const disabled = isContextMenuItemDisabled(menuItem, activeContextMenu.item);

              return (
                <button
                  className={`block w-full px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                    menuItem.danger ? "text-red-700 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  disabled={disabled}
                  key={menuItem.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleContextMenuSelect(menuItem, activeContextMenu.item);
                  }}
                  role="menuitem"
                  type="button"
                >
                  {menuItem.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FileManagerState({ label }: { label: ReactNode }) {
  return (
    <div className="flex min-h-48 items-center justify-center px-4 py-12 text-sm text-gray-500">
      {label}
    </div>
  );
}

