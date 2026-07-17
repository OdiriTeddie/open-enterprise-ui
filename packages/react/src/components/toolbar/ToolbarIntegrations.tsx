import { useMemo, useState } from "react";
import { DataGrid } from "../data-grid";
import type { Column, FilterState, RowId } from "../data-grid";
import { FileManager } from "../file-manager";
import type { FileManagerItem, FileManagerViewMode } from "../file-manager";
import { Toolbar } from "./Toolbar";
import type { ToolbarItem } from "./types";

type Account = {
  id: number;
  company: string;
  owner: string;
  status: "Active" | "At risk" | "Onboarding";
};

const accountColumns: Column<Account>[] = [
  { accessorKey: "company", header: "Company", sortable: true },
  { accessorKey: "owner", header: "Owner", sortable: true },
  {
    accessorKey: "status",
    cell: ({ value }) => (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
        {String(value)}
      </span>
    ),
    header: "Status",
    sortable: true,
  },
];

const accounts: Account[] = [
  { company: "Acme Operations", id: 1, owner: "Ada Lovelace", status: "Active" },
  { company: "Northwind Finance", id: 2, owner: "Grace Hopper", status: "At risk" },
  { company: "Contoso Supply", id: 3, owner: "Katherine Johnson", status: "Onboarding" },
  { company: "Fabrikam Legal", id: 4, owner: "Mary Jackson", status: "Active" },
  { company: "Globex Procurement", id: 5, owner: "Dorothy Vaughan", status: "Active" },
];

const fileItems: FileManagerItem[] = [
  { id: "contracts", modifiedAt: "2026-07-02T09:30:00Z", name: "Contracts", type: "folder" },
  { extension: "pdf", id: "msa", modifiedAt: "2026-07-08T15:20:00Z", name: "Master service agreement.pdf", size: 1820000, type: "file" },
  { extension: "xlsx", id: "forecast", modifiedAt: "2026-07-09T08:45:00Z", name: "Forecast.xlsx", size: 612000, type: "file" },
];

export function ToolbarDataGridIntegrationExample() {
  const [filter, setFilter] = useState<FilterState>({ global: "" });
  const [selectedRowIds, setSelectedRowIds] = useState<RowId[]>([]);

  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      { id: "export", label: "Export", onSelect: () => undefined, variant: "primary" },
      { disabled: selectedRowIds.length === 0, id: "assign", label: "Assign", onSelect: () => undefined },
      { id: "separator", type: "separator" },
      { id: "risk", label: "At risk", onSelect: () => setFilter({ global: "At risk" }), pressed: filter.global === "At risk" },
      { id: "clear", label: "Clear", onSelect: () => setFilter({ global: "" }), variant: "subtle" },
    ],
    [filter.global, selectedRowIds.length],
  );

  return (
    <div className="space-y-3">
      <Toolbar
        ariaLabel="Account grid commands"
        items={toolbarItems}
        trailing={<span className="px-2 text-xs text-gray-500">{selectedRowIds.length} selected</span>}
      >
        <input
          aria-label="Search accounts"
          className="min-h-9 w-48 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          onChange={(event) => setFilter({ global: event.target.value })}
          placeholder="Search accounts"
          type="search"
          value={filter.global}
        />
      </Toolbar>

      <DataGrid
        ariaLabel="Accounts table"
        columns={accountColumns}
        data={accounts}
        enableRowSelection
        filter={filter}
        getRowId={(account) => account.id}
        onFilterChange={setFilter}
        onRowSelectionChange={setSelectedRowIds}
        selectedRowIds={selectedRowIds}
        showGlobalFilter={false}
      />
    </div>
  );
}

export function ToolbarFileManagerIntegrationExample() {
  const [viewMode, setViewMode] = useState<FileManagerViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<RowId[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      { id: "upload", label: "Upload", onSelect: () => undefined, variant: "primary" },
      { id: "folder", label: "New folder", onSelect: () => undefined },
      { id: "separator", type: "separator" },
      { id: "list", label: "List", onSelect: () => setViewMode("list"), pressed: viewMode === "list" },
      { id: "grid", label: "Grid", onSelect: () => setViewMode("grid"), pressed: viewMode === "grid" },
      { disabled: selectedIds.length === 0, id: "download", label: "Download", onSelect: () => undefined },
    ],
    [selectedIds.length, viewMode],
  );

  return (
    <div className="space-y-3">
      <Toolbar
        ariaLabel="File manager commands"
        items={toolbarItems}
        trailing={<span className="px-2 text-xs text-gray-500">{selectedIds.length} selected</span>}
      >
        <input
          aria-label="Search files"
          className="min-h-9 w-48 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search files"
          type="search"
          value={searchValue}
        />
      </Toolbar>

      <FileManager
        breadcrumbs={[{ label: "Company Drive", path: "/" }]}
        items={fileItems}
        onCreateFolder={() => undefined}
        onDownload={() => undefined}
        onSearchChange={setSearchValue}
        onSelectionChange={({ selectedIds: nextSelectedIds }) => setSelectedIds(nextSelectedIds)}
        onUpload={() => undefined}
        searchValue={searchValue}
        selectedIds={selectedIds}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
