import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DataGrid } from "../data-grid";
import type { Column, RowId } from "../data-grid";
import { FileManager } from "../file-manager";
import type { FileManagerItem } from "../file-manager";
import { Toolbar } from "../toolbar";
import type { ToolbarItem } from "../toolbar";
import { ToastProvider } from "./ToastProvider";
import { ToastViewport } from "./ToastViewport";
import { useToast } from "./useToast";

type Invoice = {
  amount: string;
  customer: string;
  id: number;
  status: "Paid" | "Open";
};

const invoiceColumns: Column<Invoice>[] = [
  { accessorKey: "customer", header: "Customer", sortable: true },
  { accessorKey: "amount", header: "Amount", sortable: true },
  { accessorKey: "status", header: "Status", sortable: true },
];

const invoices: Invoice[] = [
  { amount: "$4,200", customer: "Acme Operations", id: 1, status: "Open" },
  { amount: "$8,950", customer: "Northwind Finance", id: 2, status: "Paid" },
  { amount: "$2,700", customer: "Contoso Supply", id: 3, status: "Open" },
];

const files: FileManagerItem[] = [
  { id: "contracts", modifiedAt: "2026-07-02T09:30:00Z", name: "Contracts", type: "folder" },
  { extension: "pdf", id: "invoice-pack", modifiedAt: "2026-07-08T15:20:00Z", name: "Invoice pack.pdf", size: 1820000, type: "file" },
];

function ToastToolbarIntegrationContent() {
  const { showToast } = useToast();
  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      {
        id: "refresh",
        label: "Refresh",
        onSelect: () => showToast({ description: "Dashboard data is current.", title: "Refresh complete", variant: "success" }),
        variant: "primary",
      },
      {
        id: "sync",
        label: "Sync",
        onSelect: () => showToast({ description: "Background sync has started.", title: "Sync started", variant: "info" }),
      },
    ],
    [showToast],
  );

  return <Toolbar ariaLabel="Toast toolbar commands" items={toolbarItems} />;
}

export function ToastToolbarIntegrationExample() {
  return (
    <ToastProvider>
      <ToastToolbarIntegrationContent />
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastDataGridIntegrationContent() {
  const { showToast } = useToast();
  const [selectedRowIds, setSelectedRowIds] = useState<RowId[]>([]);
  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      {
        disabled: selectedRowIds.length === 0,
        id: "archive",
        label: "Archive selected",
        onSelect: () => showToast({ description: `${selectedRowIds.length} invoices archived.`, title: "Archive complete", variant: "success" }),
        variant: "primary",
      },
    ],
    [selectedRowIds.length, showToast],
  );

  return (
    <div className="space-y-3">
      <Toolbar ariaLabel="Invoice grid commands" items={toolbarItems} trailing={<span className="text-xs text-gray-500">{selectedRowIds.length} selected</span>} />
      <DataGrid
        ariaLabel="Invoices table"
        columns={invoiceColumns}
        data={invoices}
        enableRowSelection
        getRowId={(invoice) => invoice.id}
        onRowSelectionChange={setSelectedRowIds}
        selectedRowIds={selectedRowIds}
        showGlobalFilter={false}
      />
    </div>
  );
}

export function ToastDataGridIntegrationExample() {
  return (
    <ToastProvider>
      <ToastDataGridIntegrationContent />
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastFormIntegrationContent() {
  const { toastPromise } = useToast();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const promise = Promise.resolve("Profile settings are live.");

    void toastPromise(promise, {
      error: { title: "Save failed", variant: "error" },
      loading: { title: "Saving profile", variant: "info" },
      success: (message) => ({ description: message, title: "Profile saved", variant: "success" }),
    });
  }

  return (
    <form className="space-y-3 rounded-md border border-gray-200 bg-white p-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700" htmlFor="profile-name">Profile name</label>
      <input className="min-h-9 rounded-md border border-gray-300 px-3 text-sm" defaultValue="Operations Admin" id="profile-name" />
      <button className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white" type="submit">Save profile</button>
    </form>
  );
}

export function ToastFormIntegrationExample() {
  return (
    <ToastProvider>
      <ToastFormIntegrationContent />
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastFileManagerIntegrationContent() {
  const { showToast } = useToast();

  return (
    <FileManager
      breadcrumbs={[{ label: "Company Drive", path: "/" }]}
      items={files}
      onDelete={(itemsToDelete) => { showToast({ description: `${itemsToDelete.length} items deleted.`, title: "Delete complete", variant: "success" }); }}
      onDownload={(itemsToDownload) => { showToast({ description: `${itemsToDownload.length} items queued.`, title: "Download started", variant: "info" }); }}
      onUpload={(uploadedFiles) => { showToast({ description: `${uploadedFiles.length} files uploaded.`, title: "Upload complete", variant: "success" }); }}
    />
  );
}

export function ToastFileManagerIntegrationExample() {
  return (
    <ToastProvider>
      <ToastFileManagerIntegrationContent />
      <ToastViewport />
    </ToastProvider>
  );
}
