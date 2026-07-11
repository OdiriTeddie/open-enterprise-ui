# File Manager

`FileManager` provides a typed, data-source agnostic file browser for enterprise apps. It renders folders and files, handles selection and view state, and emits callbacks for app-owned file operations.

## Import

```tsx
import {
  FileManager,
  type FileManagerItem,
} from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
const items: FileManagerItem[] = [
  { id: "contracts", name: "Contracts", type: "folder" },
  {
    id: "roadmap",
    name: "Roadmap.pdf",
    type: "file",
    extension: "pdf",
    size: 1_820_000,
    modifiedAt: "2026-07-08T15:20:00Z",
  },
];

<FileManager
  breadcrumbs={[{ label: "Company Drive", path: "/" }]}
  items={items}
  onItemOpen={(item) => openItem(item)}
  onDownload={(selectedItems) => downloadItems(selectedItems)}
  onDelete={(selectedItems) => deleteItems(selectedItems)}
  onUpload={(files) => uploadFiles(files)}
  onCreateFolder={() => openCreateFolderDialog()}
/>
```


## Data Provider Mode

Use `dataProvider` when the File Manager should own folder loading and refresh after mutations. This is the preferred architecture for server-backed file systems.

```tsx
const dataProvider = {
  async loadFolder(folderId) {
    const folder = await api.files.list(folderId);

    return {
      breadcrumbs: folder.breadcrumbs,
      items: folder.items,
    };
  },
  async deleteItems(items, folderId) {
    await api.files.delete(items.map((item) => item.id));
  },
  async moveItems(items, destinationFolderId, folderId) {
    await api.files.move(items.map((item) => item.id), destinationFolderId);
  },
  async copyItems(items, destinationFolderId, folderId) {
    await api.files.copy(items.map((item) => item.id), destinationFolderId);
  },
  async renameItem(item, name, folderId) {
    await api.files.rename(item.id, name);
  },
  async downloadItems(items) {
    await api.files.download(items.map((item) => item.id));
  },
  async createFolder(folderId) {
    await api.files.createFolder(folderId, "New folder");
  },
  async uploadFiles(folderId) {
    openUploadDialog(folderId);
  },
};

<FileManager dataProvider={dataProvider} defaultFolderId="root" />
```

When a provider is supplied, opening a folder calls `loadFolder(folderId)`, breadcrumbs use provider results, and provider mutations refresh the current folder after they complete.

Provider methods:

| Method | Description |
| --- | --- |
| `loadFolder(folderId)` | Required. Returns the current folder items and optional breadcrumbs. |
| `createFolder(folderId)` | Called by the New folder toolbar action. |
| `uploadFiles(files, folderId)` | Called after the Upload dialog selects files, then refreshes. |
| `uploadFiles(folderId)` | Called by the Upload toolbar action. |
| `downloadItems(items, folderId)` | Called with selected items. |
| `moveItems(items, destinationFolderId, folderId)` | Called from the Move context menu flow, then refreshes. |
| `copyItems(items, destinationFolderId, folderId)` | Called from the Copy context menu flow, then refreshes. |
| `renameItem(item, name, folderId)` | Called from the Rename context menu flow, then refreshes. |
| `deleteItems(items, folderId)` | Called with selected items, then refreshes. |
| `openFile(item, folderId)` | Called when opening a file. |

Use `renderError` or `errorMessage` to customize provider load/action failures.

## Folder Navigation

Provider mode supports folder navigation out of the box. Opening a folder calls `loadFolder(folderId)`, breadcrumbs are updated from the provider result, and Back, Up, and Refresh controls are shown by default.

```tsx
<FileManager
  dataProvider={dataProvider}
  defaultFolderId="root"
  onFolderChange={(folderId) => setCurrentFolder(folderId)}
  onRefresh={(folderId) => trackRefresh(folderId)}
/>
```

Use `folderId` for controlled navigation. In manual mode, provide `onFolderChange` to receive folder-open and breadcrumb navigation events while your app swaps `items` and `breadcrumbs`.

Set `showNavigationControls={false}` if your shell already provides navigation controls.
## Controlled State

Search, sort, selected IDs, and view mode can be controlled by the app.

```tsx
<FileManager
  items={items}
  searchValue={query}
  onSearchChange={setQuery}
  selectedIds={selectedIds}
  onSelectionChange={({ selectedIds }) => setSelectedIds(selectedIds)}
  sort={sort}
  onSortChange={setSort}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
/>
```



## Upload UX

The Upload toolbar action opens a file picker dialog. Selected files are listed before submit, and the component validates that at least one file was chosen.

```tsx
<FileManager
  items={items}
  onUpload={async (files) => {
    await uploadFiles(files);
  }}
/>
```

In provider mode, `uploadFiles(files, folderId)` runs and the current folder refreshes after a successful upload.
## Context Menu

Each item exposes built-in context menu actions for `Open`, `Copy`, `Move`, `Rename`, `Download`, and `Delete`. Users can open the menu with right click or the item action button.

Add product-specific actions with `contextMenuItems`:

```tsx
<FileManager
  items={items}
  contextMenuItems={[
    {
      id: "preview",
      label: "Preview",
      onSelect: (item) => openPreview(item),
    },
    {
      id: "audit-log",
      label: "View audit log",
      disabled: (item) => item.type === "folder",
      onSelect: (item) => openAuditLog(item),
    },
  ]}
  onContextMenuOpen={(item) => trackMenuOpen(item)}
/>
```

`disabled` can be a boolean or a function of the current item. Use `danger` for destructive custom actions.
## Render Slots

Use `renderLoading` and `renderEmpty` when the product needs branded states.

```tsx
<FileManager
  items={items}
  loading={isLoading}
  renderLoading={() => <div>Loading workspace files...</div>}
  renderEmpty={() => <div>No documents have been uploaded yet.</div>}
/>
```

## Behavior

- Folders are always sorted before files.
- Search matches item name, extension, path, and type.
- Selection supports controlled and uncontrolled state.
- Toolbar actions are disabled when their callback is missing or no item is selected.
- Back, Up, and Refresh navigation controls are shown by default.
- The component does not perform filesystem or network operations directly.

## Props

| Prop | Description |
| --- | --- |
| `items` | Files and folders to render in manual mode. |
| `dataProvider` | Server/data provider for folder loading and file operations. |
| `defaultFolderId` | Initial uncontrolled folder loaded by `dataProvider`. |
| `folderId` | Controlled current folder id. |
| `onFolderChange` | Called when a folder, breadcrumb, Back, or Up navigation changes folder. |
| `onRefresh` | Called when the Refresh control is activated. |
| `showNavigationControls` | Shows or hides Back, Up, and Refresh controls. |
| `breadcrumbs` | Current folder path. |
| `selectedIds` / `defaultSelectedIds` | Controlled or uncontrolled selected item IDs. |
| `searchValue` / `onSearchChange` | Controlled search query. |
| `sort` / `defaultSort` / `onSortChange` | Sort state. |
| `viewMode` / `defaultViewMode` / `onViewModeChange` | `list` or `grid` view. |
| `onItemOpen` | Called when a file or folder name is activated. |
| `onRename` | Called with the item and new name from the Rename flow. |
| `onMove` / `onCopy` | Called with the item list and destination folder id. |
| `destinationFolders` | Folder choices for Move and Copy when not using visible folders as destinations. |
| `contextMenuItems` | Custom item-level context menu actions. |
| `onContextMenuOpen` | Called when an item context menu opens. |
| `onDownload` / `onDelete` | Called with selected items. |
| `onUpload` / `onCreateFolder` | Upload receives selected `File[]`; create folder is called from the toolbar. |
| `renderLoading` / `renderEmpty` | Custom loading and empty states. |
| `renderError` / `errorMessage` | Custom provider error state. |







