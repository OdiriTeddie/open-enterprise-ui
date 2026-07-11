import type { ReactNode } from "react";

export type FileManagerItemType = "file" | "folder";
export type FileManagerViewMode = "list" | "grid";
export type FileManagerSortDirection = "asc" | "desc";
export type FileManagerSortKey = "name" | "size" | "type" | "modifiedAt";
export type FileManagerItemId = string | number;

export type FileManagerItem = {
  createdAt?: Date | string;
  extension?: string;
  id: FileManagerItemId;
  modifiedAt?: Date | string;
  name: string;
  path?: string;
  selected?: boolean;
  size?: number;
  type: FileManagerItemType;
};

export type FileManagerBreadcrumb = {
  id?: FileManagerItemId;
  label: ReactNode;
  path?: string;
};

export type FileManagerSortState = {
  direction: FileManagerSortDirection;
  key: FileManagerSortKey;
};

export type FileManagerSelectionChange = {
  item: FileManagerItem;
  selectedIds: FileManagerItemId[];
};

export type FileManagerContextMenuItem = {
  danger?: boolean;
  disabled?: boolean | ((item: FileManagerItem) => boolean);
  id: string;
  label: ReactNode;
  onSelect: (item: FileManagerItem) => void;
};

export type FileManagerLoadResult = {
  breadcrumbs?: FileManagerBreadcrumb[];
  items: FileManagerItem[];
};

export type FileManagerDataProvider = {
  createFolder?: (folderId?: FileManagerItemId) => void | Promise<void>;
  deleteItems?: (items: FileManagerItem[], folderId?: FileManagerItemId) => void | Promise<void>;
  downloadItems?: (items: FileManagerItem[], folderId?: FileManagerItemId) => void | Promise<void>;
  loadFolder: (folderId?: FileManagerItemId) => FileManagerLoadResult | Promise<FileManagerLoadResult>;
  openFile?: (item: FileManagerItem, folderId?: FileManagerItemId) => void | Promise<void>;
  renameItem?: (item: FileManagerItem, name: string, folderId?: FileManagerItemId) => void | Promise<void>;
  uploadFiles?: (folderId?: FileManagerItemId) => void | Promise<void>;
};

export type FileManagerProps = {
  ariaLabel?: string;
  breadcrumbs?: FileManagerBreadcrumb[];
  className?: string;
  contextMenuItems?: FileManagerContextMenuItem[];
  dataProvider?: FileManagerDataProvider;
  defaultFolderId?: FileManagerItemId;
  defaultSelectedIds?: FileManagerItemId[];
  defaultSort?: FileManagerSortState;
  defaultViewMode?: FileManagerViewMode;
  emptyMessage?: ReactNode;
  errorMessage?: ReactNode;
  getItemId?: (item: FileManagerItem) => FileManagerItemId;
  items?: FileManagerItem[];
  loading?: boolean;
  noResultsMessage?: ReactNode;
  onBreadcrumbClick?: (breadcrumb: FileManagerBreadcrumb, index: number) => void;
  onCreateFolder?: () => void;
  onDelete?: (items: FileManagerItem[]) => void;
  onDownload?: (items: FileManagerItem[]) => void;
  onError?: (error: unknown) => void;
  onFolderChange?: (folderId?: FileManagerItemId) => void;
  onContextMenuOpen?: (item: FileManagerItem) => void;
  onItemOpen?: (item: FileManagerItem) => void;
  onRename?: (item: FileManagerItem, name: string) => void | Promise<void>;
  onSearchChange?: (query: string) => void;
  onSelectionChange?: (change: FileManagerSelectionChange) => void;
  onSortChange?: (sort: FileManagerSortState) => void;
  onUpload?: () => void;
  onViewModeChange?: (viewMode: FileManagerViewMode) => void;
  renderEmpty?: () => ReactNode;
  renderError?: (error: unknown) => ReactNode;
  renderLoading?: () => ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  selectedIds?: FileManagerItemId[];
  sort?: FileManagerSortState;
  viewMode?: FileManagerViewMode;
};


