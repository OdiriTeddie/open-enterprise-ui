import { FileManager } from "./FileManager";
import type { FileManagerItem } from "./types";

const files: FileManagerItem[] = [
  {
    id: "contracts",
    modifiedAt: "2026-07-02T09:30:00Z",
    name: "Contracts",
    type: "folder",
  },
  {
    id: "finance",
    modifiedAt: "2026-07-05T11:10:00Z",
    name: "Finance",
    type: "folder",
  },
  {
    extension: "pdf",
    id: "q3-roadmap",
    modifiedAt: "2026-07-08T15:20:00Z",
    name: "Q3 roadmap.pdf",
    size: 1820000,
    type: "file",
  },
  {
    extension: "xlsx",
    id: "revenue-model",
    modifiedAt: "2026-07-09T08:45:00Z",
    name: "Revenue model.xlsx",
    size: 612000,
    type: "file",
  },
  {
    extension: "docx",
    id: "vendor-review",
    modifiedAt: "2026-07-01T13:00:00Z",
    name: "Vendor review.docx",
    size: 284000,
    type: "file",
  },
];

export function FileManagerExample() {
  return (
    <FileManager
      breadcrumbs={[
        { label: "Company Drive", path: "/" },
        { label: "Operations", path: "/operations" },
      ]}
      items={files}
      onCreateFolder={() => undefined}
      onDelete={() => undefined}
      onDownload={() => undefined}
      onItemOpen={() => undefined}
      onUpload={() => undefined}
    />
  );
}

export { FileManager } from "./FileManager";
export type {
  FileManagerBreadcrumb,
  FileManagerDataProvider,
  FileManagerLoadResult,
  FileManagerItem,
  FileManagerItemId,
  FileManagerItemType,
  FileManagerProps,
  FileManagerSelectionChange,
  FileManagerSortDirection,
  FileManagerSortKey,
  FileManagerSortState,
  FileManagerViewMode,
} from "./types";


