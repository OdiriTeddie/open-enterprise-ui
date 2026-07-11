import { useEffect, useId, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import type {
  FileManagerBreadcrumb,
  FileManagerContextMenuItem,
  FileManagerFolderOption,
  FileManagerItem,
  FileManagerItemId,
  FileManagerPermissionAction,
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

type TransferDialog = {
  item: FileManagerItem;
  mode: "copy" | "move";
};

export function FileManager({
  ariaLabel = "File manager",
  breadcrumbs = defaultBreadcrumbs,
  className = "",
  contextMenuItems = [],
  dataProvider,
  destinationFolders,
  defaultFolderId,
  defaultSelectedIds = [],
  defaultSort = { direction: "asc", key: "name" },
  defaultViewMode = "list",
  emptyMessage = "No files or folders.",
  errorMessage = "Unable to load files.",
  folderId,
  getItemId = (item) => item.id,
  items = [],
  loading = false,
  noResultsMessage = "No files match your search.",
  permissions = {},
  onBreadcrumbClick,
  onCopy,
  onContextMenuOpen,
  onCreateFolder,
  onDelete,
  onDetailsClose,
  onDetailsOpen,
  onDownload,
  onError,
  onFolderChange,
  onMove,
  onItemOpen,
  onRefresh,
  onRename,
  onSearchChange,
  onSelectionChange,
  onSortChange,
  onUpload,
  onViewModeChange,
  renderDetails,
  renderEmpty,
  renderError,
  renderLoading,
  searchPlaceholder = "Search files...",
  showNavigationControls = true,
  searchValue,
  selectedIds,
  sort,
  viewMode,
}: FileManagerProps) {
  const searchInputId = useId();
  const [internalFolderId, setInternalFolderId] = useState<FileManagerItemId | undefined>(defaultFolderId);
  const [navigationHistory, setNavigationHistory] = useState<Array<FileManagerItemId | undefined>>([]);
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
  const [detailsItem, setDetailsItem] = useState<FileManagerItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileManagerItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | undefined>();
  const [transferDialog, setTransferDialog] = useState<TransferDialog | null>(null);
  const [transferDestinationId, setTransferDestinationId] = useState<FileManagerItemId | "">("");
  const [transferError, setTransferError] = useState<string | undefined>();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const currentFolderId = folderId ?? internalFolderId;

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
        setDetailsItem(null);
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
  const availableDestinationFolders = useMemo<Array<FileManagerFolderOption>>(
    () =>
      destinationFolders ??
      effectiveItems
        .filter((item) => item.type === "folder")
        .map((item) => ({
          id: getItemId(item),
          label: item.name,
          path: item.path,
        })),
    [destinationFolders, effectiveItems, getItemId],
  );

  const canGoBack = navigationHistory.length > 0;
  const canGoUp = effectiveBreadcrumbs.length > 1;
  const canNavigateFolders = Boolean(dataProvider || onFolderChange);

  const canCreateFolder = Boolean(onCreateFolder || dataProvider?.createFolder) && hasPermission("createFolder");
  const canCopy = Boolean(onCopy || dataProvider?.copyItems) && hasPermission("copy");
  const canDelete = Boolean(onDelete || dataProvider?.deleteItems) && hasPermission("delete");
  const canDownload = Boolean(onDownload || dataProvider?.downloadItems) && hasPermission("download");
  const canMove = Boolean(onMove || dataProvider?.moveItems) && hasPermission("move");
  const canRename = Boolean(onRename || dataProvider?.renameItem) && hasPermission("rename");
  const canUpload = Boolean(onUpload || dataProvider?.uploadFiles) && hasPermission("upload");
  const selectedItemsCanDownload = selectedItems.length > 0 && selectedItems.every((item) => hasPermission("download", item));
  const selectedItemsCanDelete = selectedItems.length > 0 && selectedItems.every((item) => hasPermission("delete", item));

  const builtInContextMenuItems: Array<FileManagerContextMenuItem> = [
    {
      id: "open",
      label: "Open",
      disabled: (item) => !hasPermission("open", item),
      onSelect: (item) => handleItemOpen(item),
    },
    {
      id: "details",
      disabled: (item) => !hasPermission("details", item),
      label: "Details",
      onSelect: (item) => handleDetailsOpen(item),
    },
    {
      disabled: (item) => !canCopy || !hasPermission("copy", item) || availableDestinationFolders.length === 0,
      id: "copy",
      label: "Copy",
      onSelect: (item) => handleTransferStart(item, "copy"),
    },
    {
      disabled: (item) => !canMove || !hasPermission("move", item) || availableDestinationFolders.length === 0,
      id: "move",
      label: "Move",
      onSelect: (item) => handleTransferStart(item, "move"),
    },
    {
      disabled: (item) => !canRename || !hasPermission("rename", item),
      id: "rename",
      label: "Rename",
      onSelect: (item) => handleRenameStart(item),
    },
    {
      disabled: (item) => item.type === "folder" || !canDownload || !hasPermission("download", item),
      id: "download",
      label: "Download",
      onSelect: (item) => handleDownloadItems([item]),
    },
    {
      danger: true,
      disabled: (item) => !canDelete || !hasPermission("delete", item),
      id: "delete",
      label: "Delete",
      onSelect: (item) => handleDeleteItems([item]),
    },
  ];
  const activeContextMenuItems = [...builtInContextMenuItems, ...contextMenuItems];

  function hasPermission(action: FileManagerPermissionAction, item?: FileManagerItem) {
    const rule = permissions[action];

    if (typeof rule === "function") {
      return rule(item);
    }

    return rule ?? true;
  }

  function refreshProvider() {
    if (dataProvider) {
      setReloadKey((currentKey) => currentKey + 1);
    }

    onRefresh?.(currentFolderId);
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
    if (!hasPermission("select", item)) {
      return;
    }

    const itemId = getItemId(item);
    const nextSelectedIds = toggleSelection(currentSelectedIds, itemId);

    if (selectedIds === undefined) {
      setInternalSelectedIds(nextSelectedIds);
    }

    onSelectionChange?.({ item, selectedIds: nextSelectedIds });
  }

  function handleSelectAll() {
    const selectableItems = visibleItems.filter((item) => hasPermission("select", item));
    const visibleIds = selectableItems.map(getItemId);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((itemId) => currentSelectedIds.includes(itemId));
    const nextSelectedIds = allVisibleSelected
      ? currentSelectedIds.filter((itemId) => !visibleIds.includes(itemId))
      : Array.from(new Set([...currentSelectedIds, ...visibleIds]));

    if (selectedIds === undefined) {
      setInternalSelectedIds(nextSelectedIds);
    }
  }

  function handleFolderChange(nextFolderId?: FileManagerItemId, addToHistory = true) {
    if (nextFolderId === currentFolderId) {
      return;
    }

    if (addToHistory) {
      setNavigationHistory((currentHistory) => [...currentHistory, currentFolderId]);
    }

    if (folderId === undefined) {
      setInternalFolderId(nextFolderId);
    }

    setInternalSearch("");
    setInternalSelectedIds([]);
    setActiveContextMenu(null);
    setDetailsItem(null);
    setRenameItem(null);
    setTransferDialog(null);
    setUploadDialogOpen(false);
    onFolderChange?.(nextFolderId);
  }

  function handleBack() {
    setNavigationHistory((currentHistory) => {
      if (currentHistory.length === 0) {
        return currentHistory;
      }

      const nextHistory = currentHistory.slice(0, -1);
      const previousFolderId = currentHistory[currentHistory.length - 1];

      if (folderId === undefined) {
        setInternalFolderId(previousFolderId);
      }

      setInternalSearch("");
      setInternalSelectedIds([]);
      setActiveContextMenu(null);
      setDetailsItem(null);
      onFolderChange?.(previousFolderId);

      return nextHistory;
    });
  }

  function handleUp() {
    const parentBreadcrumb = effectiveBreadcrumbs[effectiveBreadcrumbs.length - 2];

    if (parentBreadcrumb) {
      handleFolderChange(parentBreadcrumb.id);
    }
  }

  function handleBreadcrumbClick(breadcrumb: FileManagerBreadcrumb, index: number) {
    onBreadcrumbClick?.(breadcrumb, index);

    if (canNavigateFolders) {
      handleFolderChange(breadcrumb.id);
    }
  }

  function handleItemOpen(item: FileManagerItem) {
    if (!hasPermission("open", item)) {
      return;
    }

    setActiveContextMenu(null);

    if (item.type === "folder" && canNavigateFolders) {
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
    if (!hasPermission("createFolder")) {
      return;
    }

    if (onCreateFolder) {
      onCreateFolder();
      return;
    }

    if (dataProvider?.createFolder) {
      void runProviderAction(() => dataProvider.createFolder?.(currentFolderId));
    }
  }

  function handleUpload() {
    if (!hasPermission("upload")) {
      return;
    }

    setUploadDialogOpen(true);
    setUploadFiles([]);
    setUploadError(undefined);
  }

  async function handleUploadSubmit() {
    if (uploadFiles.length === 0) {
      setUploadError("Choose at least one file.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(undefined);

      if (onUpload) {
        await onUpload(uploadFiles);
      } else if (dataProvider?.uploadFiles) {
        await dataProvider.uploadFiles(uploadFiles, currentFolderId);
        refreshProvider();
      }

      setUploadDialogOpen(false);
      setUploadFiles([]);
    } catch (error) {
      setUploadError("Unable to upload files.");
      onError?.(error);
    } finally {
      setUploading(false);
    }
  }

  function handleDownloadItems(itemsToDownload: FileManagerItem[]) {
    if (!itemsToDownload.every((item) => hasPermission("download", item))) {
      return;
    }

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
    if (!itemsToDelete.every((item) => hasPermission("delete", item))) {
      return;
    }

    setActiveContextMenu(null);

    if (onDelete) {
      onDelete(itemsToDelete);
      return;
    }

    if (dataProvider?.deleteItems) {
      void runProviderAction(() => dataProvider.deleteItems?.(itemsToDelete, currentFolderId));
    }
  }

  function handleTransferStart(item: FileManagerItem, mode: "copy" | "move") {
    if (!hasPermission(mode, item)) {
      return;
    }

    setActiveContextMenu(null);
    setTransferDialog({ item, mode });
    setTransferDestinationId("");
    setTransferError(undefined);
  }

  async function handleTransferSubmit() {
    if (!transferDialog) {
      return;
    }

    if (!transferDestinationId) {
      setTransferError("Choose a destination folder.");
      return;
    }

    const itemsToTransfer = [transferDialog.item];

    try {
      setTransferError(undefined);

      if (transferDialog.mode === "copy") {
        if (onCopy) {
          await onCopy(itemsToTransfer, transferDestinationId);
        } else if (dataProvider?.copyItems) {
          await dataProvider.copyItems(itemsToTransfer, transferDestinationId, currentFolderId);
          refreshProvider();
        }
      } else if (onMove) {
        await onMove(itemsToTransfer, transferDestinationId);
      } else if (dataProvider?.moveItems) {
        await dataProvider.moveItems(itemsToTransfer, transferDestinationId, currentFolderId);
        refreshProvider();
      }

      setTransferDialog(null);
    } catch (error) {
      setTransferError(`Unable to ${transferDialog.mode} item.`);
      onError?.(error);
    }
  }
  function handleRenameStart(item: FileManagerItem) {
    if (!hasPermission("rename", item)) {
      return;
    }

    setActiveContextMenu(null);
    setRenameItem(item);
    setRenameValue(item.name);
    setRenameError(undefined);
  }

  async function handleRenameSubmit() {
    if (!renameItem) {
      return;
    }

    const nextName = renameValue.trim();

    if (!nextName) {
      setRenameError("Name is required.");
      return;
    }

    if (nextName === renameItem.name) {
      setRenameItem(null);
      return;
    }

    try {
      setRenameError(undefined);

      if (onRename) {
        await onRename(renameItem, nextName);
      } else if (dataProvider?.renameItem) {
        await dataProvider.renameItem(renameItem, nextName, currentFolderId);
        refreshProvider();
      }

      setRenameItem(null);
    } catch (error) {
      setRenameError("Unable to rename item.");
      onError?.(error);
    }
  }

  function handleDetailsOpen(item: FileManagerItem) {
    if (!hasPermission("details", item)) {
      return;
    }

    setActiveContextMenu(null);
    setDetailsItem(item);
    onDetailsOpen?.(item);
  }

  function handleDetailsClose() {
    setDetailsItem(null);
    onDetailsClose?.();
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
                      disabled={!hasPermission("select", item)}
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
                  checked={visibleItems.some((item) => hasPermission("select", item)) && visibleItems.filter((item) => hasPermission("select", item)).every((item) => currentSelectedIds.includes(getItemId(item)))}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={!visibleItems.some((item) => hasPermission("select", item))}
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
                      disabled={!hasPermission("select", item)}
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
          {showNavigationControls ? (
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canGoBack || effectiveLoading} onClick={handleBack} type="button">
                Back
              </button>
              <button className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canGoUp || effectiveLoading} onClick={handleUp} type="button">
                Up
              </button>
              <button className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={effectiveLoading} onClick={refreshProvider} type="button">
                Refresh
              </button>
            </div>
          ) : null}
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
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canDownload || !selectedItemsCanDownload || effectiveLoading} onClick={() => handleDownloadItems(selectedItems)} type="button">
              Download
            </button>
            <button className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canDelete || !selectedItemsCanDelete || effectiveLoading} onClick={() => handleDeleteItems(selectedItems)} type="button">
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

      {detailsItem ? (
        <aside aria-label={`Details for ${detailsItem.name}`} className="absolute inset-y-0 right-0 z-30 w-full max-w-sm border-l border-gray-200 bg-white shadow-xl" role="dialog">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">Details</h2>
            <button className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={handleDetailsClose} type="button">
              Close
            </button>
          </div>
          <div className="space-y-4 p-4 text-sm">
            {renderDetails ? (
              renderDetails(detailsItem)
            ) : (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">Name</dt>
                  <dd className="mt-1 break-words text-gray-900">{detailsItem.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">Type</dt>
                  <dd className="mt-1 text-gray-900">{detailsItem.type === "folder" ? "Folder" : detailsItem.extension ?? "File"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">Size</dt>
                  <dd className="mt-1 text-gray-900">{formatFileSize(detailsItem.size)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">Path</dt>
                  <dd className="mt-1 break-words text-gray-900">{detailsItem.path ?? "--"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900">{formatFileDate(detailsItem.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">Modified</dt>
                  <dd className="mt-1 text-gray-900">{formatFileDate(detailsItem.modifiedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500">ID</dt>
                  <dd className="mt-1 break-words text-gray-900">{String(getItemId(detailsItem))}</dd>
                </div>
              </dl>
            )}
          </div>
        </aside>
      ) : null}

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


      {uploadDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="presentation">
          <div aria-label="Upload files" className="w-full max-w-md rounded-md bg-white p-4 shadow-lg" role="dialog">
            <h2 className="text-base font-semibold text-gray-900">Upload files</h2>
            <p className="mt-1 text-sm text-gray-600">Choose one or more files to upload to this folder.</p>
            <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600 hover:border-gray-400" htmlFor={`${searchInputId}-upload`}>
              <span className="font-medium text-gray-900">Select files</span>
              <span className="mt-1">Drag files here in your app, or browse from your device.</span>
            </label>
            <input
              className="sr-only"
              id={`${searchInputId}-upload`}
              multiple
              onChange={(event) => {
                setUploadFiles(Array.from(event.target.files ?? []));
                setUploadError(undefined);
              }}
              type="file"
            />
            {uploadFiles.length > 0 ? (
              <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-sm text-gray-700">
                {uploadFiles.map((file) => (
                  <li className="flex justify-between gap-3 rounded bg-gray-50 px-2 py-1" key={`${file.name}-${file.size}`}>
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-gray-500">{formatFileSize(file.size)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {uploadError ? <div className="mt-2 text-sm text-red-700" role="alert">{uploadError}</div> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={uploading} onClick={() => setUploadDialogOpen(false)} type="button">
                Cancel
              </button>
              <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={uploading} onClick={() => void handleUploadSubmit()} type="button">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {transferDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="presentation">
          <div aria-label={`${transferDialog.mode === "copy" ? "Copy" : "Move"} ${transferDialog.item.name}`} className="w-full max-w-sm rounded-md bg-white p-4 shadow-lg" role="dialog">
            <h2 className="text-base font-semibold text-gray-900">{transferDialog.mode === "copy" ? "Copy" : "Move"}</h2>
            <p className="mt-1 text-sm text-gray-600">Choose a destination for {transferDialog.item.name}.</p>
            <label className="mt-3 block text-sm font-medium text-gray-700" htmlFor={`${searchInputId}-transfer`}>
              Destination
            </label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              id={`${searchInputId}-transfer`}
              onChange={(event) => setTransferDestinationId(event.target.value)}
              value={String(transferDestinationId)}
            >
              <option value="">Choose folder</option>
              {availableDestinationFolders
                .filter((folder) => folder.id !== getItemId(transferDialog.item))
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.label}</option>
                ))}
            </select>
            {transferError ? <div className="mt-2 text-sm text-red-700" role="alert">{transferError}</div> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700" onClick={() => setTransferDialog(null)} type="button">
                Cancel
              </button>
              <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white" onClick={() => void handleTransferSubmit()} type="button">
                {transferDialog.mode === "copy" ? "Copy" : "Move"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {renameItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="presentation">
          <div aria-label={`Rename ${renameItem.name}`} className="w-full max-w-sm rounded-md bg-white p-4 shadow-lg" role="dialog">
            <h2 className="text-base font-semibold text-gray-900">Rename</h2>
            <label className="mt-3 block text-sm font-medium text-gray-700" htmlFor={`${searchInputId}-rename`}>
              Name
            </label>
            <input
              autoFocus
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              id={`${searchInputId}-rename`}
              onChange={(event) => setRenameValue(event.target.value)}
              value={renameValue}
            />
            {renameError ? <div className="mt-2 text-sm text-red-700" role="alert">{renameError}</div> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700" onClick={() => setRenameItem(null)} type="button">
                Cancel
              </button>
              <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white" onClick={() => void handleRenameSubmit()} type="button">
                Save
              </button>
            </div>
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

