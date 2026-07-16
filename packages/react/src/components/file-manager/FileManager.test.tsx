import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileManager } from "./FileManager";
import type { FileManagerItem } from "./types";
import { filterFileManagerItems, formatFileSize, sortFileManagerItems } from "./utils";

const items: FileManagerItem[] = [
  { id: "archive", name: "Archive", type: "folder", modifiedAt: "2026-07-01" },
  { id: "report", name: "Report.pdf", type: "file", extension: "pdf", size: 2048, modifiedAt: "2026-07-03" },
  { id: "budget", name: "Budget.xlsx", type: "file", extension: "xlsx", size: 1024, modifiedAt: "2026-07-02" },
];

describe("FileManager", () => {
  it("renders breadcrumbs, files, and folders", () => {
    render(
      <FileManager
        breadcrumbs={[{ label: "Company Drive" }, { label: "Finance" }]}
        items={items}
      />,
    );

    expect(screen.getByRole("button", { name: "Company Drive" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Finance" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Report.pdf" })).toBeInTheDocument();
  });

  it("filters items with the search box", async () => {
    const user = userEvent.setup();

    render(<FileManager items={items} />);

    await user.type(screen.getByRole("searchbox"), "budget");

    expect(screen.getByRole("button", { name: "Budget.xlsx" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Report.pdf" })).not.toBeInTheDocument();
    expect(screen.getByText("1 found")).toBeInTheDocument();
  });

  it("selects items and sends selected items to toolbar actions", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    const onDelete = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <FileManager
        items={items}
        onDelete={onDelete}
        onDownload={onDownload}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByLabelText("Select Report.pdf"));

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(onSelectionChange).toHaveBeenCalledWith({
      item: items[1],
      selectedIds: ["report"],
    });

    await user.click(screen.getByRole("button", { name: "Download" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDownload).toHaveBeenCalledWith([items[1]]);
    expect(onDelete).toHaveBeenCalledWith([items[1]]);
  });

  it("opens items and switches to grid view", async () => {
    const user = userEvent.setup();
    const onItemOpen = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <FileManager
        items={items}
        onItemOpen={onItemOpen}
        onViewModeChange={onViewModeChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Grid" }));
    await user.click(screen.getByRole("button", { name: "Report.pdf" }));

    expect(onViewModeChange).toHaveBeenCalledWith("grid");
    expect(onItemOpen).toHaveBeenCalledWith(items[1]);
  });

  it("supports controlled sorting callbacks", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(<FileManager items={items} onSortChange={onSortChange} />);

    await user.selectOptions(screen.getByLabelText("Sort"), "size");
    await user.click(screen.getByRole("button", { name: "Ascending" }));

    expect(onSortChange).toHaveBeenNthCalledWith(1, {
      direction: "asc",
      key: "size",
    });
    expect(onSortChange).toHaveBeenNthCalledWith(2, {
      direction: "desc",
      key: "size",
    });
  });


  it("loads items from a data provider", async () => {
    const loadFolder = vi.fn().mockResolvedValue({
      breadcrumbs: [{ label: "Drive" }],
      items: [items[1]],
    });

    render(<FileManager dataProvider={{ loadFolder }} />);
    expect(await screen.findByRole("button", { name: "Report.pdf" })).toBeInTheDocument();
    expect(loadFolder).toHaveBeenCalledWith(undefined);
  });

  it("navigates folders with a data provider", async () => {
    const loadFolder = vi
      .fn()
      .mockResolvedValueOnce({
        breadcrumbs: [{ label: "Drive" }],
        items: [items[0]],
      })
      .mockResolvedValueOnce({
        breadcrumbs: [{ label: "Drive" }, { id: "archive", label: "Archive" }],
        items: [items[2]],
      });
    const onFolderChange = vi.fn();

    render(<FileManager dataProvider={{ loadFolder }} onFolderChange={onFolderChange} />);

    await userEvent.click(await screen.findByRole("button", { name: "Archive" }));

    expect(onFolderChange).toHaveBeenCalledWith("archive");
    expect(await screen.findByRole("button", { name: "Budget.xlsx" })).toBeInTheDocument();
    expect(loadFolder).toHaveBeenLastCalledWith("archive");
  });

  it("uses provider operations and refreshes after delete", async () => {
    const user = userEvent.setup();
    const deleteItems = vi.fn().mockResolvedValue(undefined);
    const loadFolder = vi
      .fn()
      .mockResolvedValueOnce({ items: [items[1]] })
      .mockResolvedValueOnce({ items: [] });

    render(<FileManager dataProvider={{ deleteItems, loadFolder }} />);

    await user.click(await screen.findByLabelText("Select Report.pdf"));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteItems).toHaveBeenCalledWith([items[1]], undefined));
    await waitFor(() => expect(loadFolder).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No files or folders.")).toBeInTheDocument();
  });

  it("renders provider errors", async () => {
    const error = new Error("Request failed");
    const onError = vi.fn();

    render(
      <FileManager
        dataProvider={{ loadFolder: vi.fn().mockRejectedValue(error) }}
        onError={onError}
        renderError={(error) => <div>Could not load: {String((error as Error).message)}</div>}
      />,
    );

    expect(await screen.findByText("Could not load: Request failed")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("opens built-in context menu actions from the item actions button", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    const onDelete = vi.fn();

    render(
      <FileManager
        items={items}
        onDelete={onDelete}
        onDownload={onDownload}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));

    expect(screen.getByRole("menu", { name: "Actions for Report.pdf" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Download" }));

    expect(onDownload).toHaveBeenCalledWith([items[1]]);

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith([items[1]]);
  });

  it("opens custom context menu actions from right click", async () => {
    const user = userEvent.setup();
    const onContextMenuOpen = vi.fn();
    const onPreview = vi.fn();

    render(
      <FileManager
        contextMenuItems={[
          {
            id: "preview",
            label: "Preview",
            onSelect: onPreview,
          },
        ]}
        items={items}
        onContextMenuOpen={onContextMenuOpen}
      />,
    );

    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: "Report.pdf" }),
    });

    expect(onContextMenuOpen).toHaveBeenCalledWith(items[1]);

    await user.click(screen.getByRole("menuitem", { name: "Preview" }));

    expect(onPreview).toHaveBeenCalledWith(items[1]);
  });

  it("disables unavailable built-in context menu actions", async () => {
    const user = userEvent.setup();

    render(<FileManager items={items} />);

    await user.click(screen.getByRole("button", { name: "Open actions for Archive" }));

    expect(screen.getByRole("menuitem", { name: "Download" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
  });

  it("renames an item from the context menu", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(<FileManager items={items} onRename={onRename} />);

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(screen.getByRole("dialog", { name: "Rename Report.pdf" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated report.pdf");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onRename).toHaveBeenCalledWith(items[1], "Updated report.pdf");
    expect(screen.queryByRole("dialog", { name: "Rename Report.pdf" })).not.toBeInTheDocument();
  });

  it("validates rename names", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(<FileManager items={items} onRename={onRename} />);

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required.");
    expect(onRename).not.toHaveBeenCalled();
  });

  it("uses provider rename and refreshes the folder", async () => {
    const user = userEvent.setup();
    const renameItem = vi.fn().mockResolvedValue(undefined);
    const loadFolder = vi
      .fn()
      .mockResolvedValueOnce({ items: [items[1]] })
      .mockResolvedValueOnce({
        items: [{ ...items[1], name: "Updated report.pdf" }],
      });

    render(<FileManager dataProvider={{ loadFolder, renameItem }} />);

    await user.click(await screen.findByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated report.pdf");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(renameItem).toHaveBeenCalledWith(items[1], "Updated report.pdf", undefined));
    expect(await screen.findByRole("button", { name: "Updated report.pdf" })).toBeInTheDocument();
  });

  it("copies an item to a selected destination", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();

    render(
      <FileManager
        destinationFolders={[{ id: "archive", label: "Archive" }]}
        items={items}
        onCopy={onCopy}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy" }));
    await user.selectOptions(screen.getByLabelText("Destination"), "archive");
    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(onCopy).toHaveBeenCalledWith([items[1]], "archive");
  });

  it("validates move destination", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();

    render(
      <FileManager
        destinationFolders={[{ id: "archive", label: "Archive" }]}
        items={items}
        onMove={onMove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Move" }));
    await user.click(screen.getByRole("button", { name: "Move" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a destination folder.");
    expect(onMove).not.toHaveBeenCalled();
  });

  it("uses provider move and refreshes the folder", async () => {
    const user = userEvent.setup();
    const moveItems = vi.fn().mockResolvedValue(undefined);
    const loadFolder = vi
      .fn()
      .mockResolvedValueOnce({ items: [items[0], items[1]] })
      .mockResolvedValueOnce({ items: [items[0]] });

    render(<FileManager dataProvider={{ loadFolder, moveItems }} />);

    await user.click(await screen.findByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Move" }));
    await user.selectOptions(screen.getByLabelText("Destination"), "archive");
    await user.click(screen.getByRole("button", { name: "Move" }));

    await waitFor(() => expect(moveItems).toHaveBeenCalledWith([items[1]], "archive", undefined));
    await waitFor(() => expect(loadFolder).toHaveBeenCalledTimes(2));
  });

  it("uploads selected files", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const file = new File(["report"], "report.pdf", { type: "application/pdf" });

    render(<FileManager items={items} onUpload={onUpload} />);

    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText(/select files/i), file);

    expect(screen.getByText("report.pdf")).toBeInTheDocument();

    await user.click(within(screen.getByRole("dialog", { name: "Upload files" })).getByRole("button", { name: "Upload" }));

    expect(onUpload).toHaveBeenCalledWith([file]);
  });

  it("validates upload file selection", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();

    render(<FileManager items={items} onUpload={onUpload} />);

    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.click(within(screen.getByRole("dialog", { name: "Upload files" })).getByRole("button", { name: "Upload" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose at least one file.");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uses provider upload and refreshes the folder", async () => {
    const user = userEvent.setup();
    const file = new File(["budget"], "budget.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const uploadFiles = vi.fn().mockResolvedValue(undefined);
    const loadFolder = vi
      .fn()
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [items[2]] });

    render(<FileManager dataProvider={{ loadFolder, uploadFiles }} />);

    await user.click(screen.getByRole("button", { name: "Upload" }));
    await user.upload(screen.getByLabelText(/select files/i), file);
    await user.click(within(screen.getByRole("dialog", { name: "Upload files" })).getByRole("button", { name: "Upload" }));

    await waitFor(() => expect(uploadFiles).toHaveBeenCalledWith([file], undefined));
    await waitFor(() => expect(loadFolder).toHaveBeenCalledTimes(2));
  });

  it("navigates back and up in provider mode", async () => {
    const user = userEvent.setup();
    const loadFolder = vi
      .fn()
      .mockResolvedValueOnce({
        breadcrumbs: [{ id: "root", label: "Drive" }],
        items: [items[0]],
      })
      .mockResolvedValueOnce({
        breadcrumbs: [{ id: "root", label: "Drive" }, { id: "archive", label: "Archive" }],
        items: [items[1]],
      })
      .mockResolvedValueOnce({
        breadcrumbs: [{ id: "root", label: "Drive" }],
        items: [items[0]],
      });

    render(<FileManager dataProvider={{ loadFolder }} defaultFolderId="root" />);

    await user.click(await screen.findByRole("button", { name: "Archive" }));
    expect(await screen.findByRole("button", { name: "Report.pdf" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(loadFolder).toHaveBeenLastCalledWith("root");
  });

  it("uses breadcrumbs and refresh callbacks for folder navigation", async () => {
    const user = userEvent.setup();
    const onFolderChange = vi.fn();
    const onRefresh = vi.fn();

    render(
      <FileManager
        breadcrumbs={[{ id: "root", label: "Drive" }, { id: "archive", label: "Archive" }]}
        items={items}
        onFolderChange={onFolderChange}
        onRefresh={onRefresh}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Drive" }));
    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(onFolderChange).toHaveBeenCalledWith("root");
    expect(onRefresh).toHaveBeenCalledWith("root");
  });

  it("opens folders in manual mode when onFolderChange is supplied", async () => {
    const user = userEvent.setup();
    const onFolderChange = vi.fn();
    const onItemOpen = vi.fn();

    render(
      <FileManager
        items={items}
        onFolderChange={onFolderChange}
        onItemOpen={onItemOpen}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(onFolderChange).toHaveBeenCalledWith("archive");
    expect(onItemOpen).toHaveBeenCalledWith(items[0]);
  });

  it("supports controlled folder id changes", async () => {
    const user = userEvent.setup();
    const loadFolder = vi.fn().mockResolvedValue({ items: [items[0]] });
    const onFolderChange = vi.fn();

    render(
      <FileManager
        dataProvider={{ loadFolder }}
        folderId="root"
        items={items}
        onFolderChange={onFolderChange}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Archive" }));

    expect(onFolderChange).toHaveBeenCalledWith("archive");
    expect(loadFolder).toHaveBeenCalledWith("root");
  });

  it("opens and closes the details panel from the context menu", async () => {
    const user = userEvent.setup();
    const onDetailsOpen = vi.fn();
    const onDetailsClose = vi.fn();

    render(
      <FileManager
        items={items}
        onDetailsClose={onDetailsClose}
        onDetailsOpen={onDetailsOpen}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Details" }));

    const dialog = screen.getByRole("dialog", { name: "Details for Report.pdf" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("2.0 KB")).toBeInTheDocument();
    expect(onDetailsOpen).toHaveBeenCalledWith(items[1]);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Details for Report.pdf" })).not.toBeInTheDocument();
    expect(onDetailsClose).toHaveBeenCalled();
  });

  it("renders custom details content", async () => {
    const user = userEvent.setup();

    render(
      <FileManager
        items={items}
        renderDetails={(item) => <div>Owner for {item.name}</div>}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    await user.click(screen.getByRole("menuitem", { name: "Details" }));

    expect(screen.getByText("Owner for Report.pdf")).toBeInTheDocument();
  });

  it("disables toolbar actions with global permissions", async () => {
    const user = userEvent.setup();
    const onCreateFolder = vi.fn();
    const onDelete = vi.fn();
    const onDownload = vi.fn();
    const onUpload = vi.fn();

    render(
      <FileManager
        items={items}
        onCreateFolder={onCreateFolder}
        onDelete={onDelete}
        onDownload={onDownload}
        onUpload={onUpload}
        permissions={{ createFolder: false, delete: false, download: false, upload: false }}
      />,
    );

    await user.click(screen.getByLabelText("Select Report.pdf"));

    expect(screen.getByRole("button", { name: "New folder" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("applies item-level permissions to built-in context menu actions", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <FileManager
        items={items}
        onRename={onRename}
        permissions={{ rename: (item) => item?.id !== "report" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));

    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeDisabled();

    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(screen.queryByRole("dialog", { name: "Rename Report.pdf" })).not.toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();
  });

  it("prevents selecting items denied by permissions", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <FileManager
        items={items}
        onSelectionChange={onSelectionChange}
        permissions={{ select: (item) => item?.id !== "report" }}
      />,
    );

    expect(screen.getByLabelText("Select Report.pdf")).toBeDisabled();

    await user.click(screen.getByLabelText("Select all visible items"));

    expect(screen.queryByText("3 selected")).not.toBeInTheDocument();
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalledWith({ item: items[1], selectedIds: ["report"] });
  });



  it("supports keyboard navigation inside the context menu", async () => {
    const user = userEvent.setup();

    render(<FileManager items={items} />);

    screen.getByRole("button", { name: "Open actions for Report.pdf" }).focus();
    await user.keyboard("{ArrowDown}");

    const menu = screen.getByRole("menu", { name: "Actions for Report.pdf" });
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Open" })).toHaveFocus());

    await user.keyboard("{ArrowDown}");
    expect(within(menu).getByRole("menuitem", { name: "Details" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Details for Report.pdf" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Details for Report.pdf" })).not.toBeInTheDocument();
  });

  it("opens the item context menu with keyboard context menu shortcuts", async () => {
    const user = userEvent.setup();

    render(<FileManager items={items} />);

    screen.getByRole("button", { name: "Report.pdf" }).focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");

    expect(screen.getByRole("menu", { name: "Actions for Report.pdf" })).toBeInTheDocument();
  });

  it("closes the context menu with Escape", async () => {
    const user = userEvent.setup();

    render(<FileManager items={items} />);

    await user.click(screen.getByRole("button", { name: "Open actions for Report.pdf" }));
    expect(screen.getByRole("menu", { name: "Actions for Report.pdf" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu", { name: "Actions for Report.pdf" })).not.toBeInTheDocument();
  });



  it("virtualizes list rows when enabled", () => {
    const manyItems = Array.from({ length: 50 }, (_, index) => ({
      id: `file-${index}`,
      name: `File ${index}.pdf`,
      type: "file" as const,
    }));

    render(
      <FileManager
        items={manyItems}
        virtualization={{ enabled: true, estimatedItemHeight: 40, overscan: 0, viewportHeight: 120 }}
      />,
    );

    expect(screen.getByRole("button", { name: "File 0.pdf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "File 2.pdf" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "File 10.pdf" })).not.toBeInTheDocument();
  });

  it("updates the virtualized list window on scroll", async () => {
    const manyItems = Array.from({ length: 50 }, (_, index) => ({
      id: `file-${index}`,
      name: `File ${index}.pdf`,
      type: "file" as const,
    }));

    const { container } = render(
      <FileManager
        items={manyItems}
        virtualization={{ enabled: true, estimatedItemHeight: 40, overscan: 0, viewportHeight: 120 }}
      />,
    );

    const scrollContainer = container.querySelector('[data-virtualized="true"]');

    expect(scrollContainer).not.toBeNull();

    scrollContainer?.dispatchEvent(new Event("scroll", { bubbles: true }));
    Object.defineProperty(scrollContainer, "scrollTop", { configurable: true, value: 400 });
    scrollContainer?.dispatchEvent(new Event("scroll", { bubbles: true }));

    expect(await screen.findByRole("button", { name: "File 10.pdf" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "File 0.pdf" })).not.toBeInTheDocument();
  });

  it("renders custom loading and empty states", () => {
    const { rerender } = render(
      <FileManager
        items={[]}
        loading
        renderLoading={() => <div>Loading workspace</div>}
      />,
    );

    expect(screen.getByText("Loading workspace")).toBeInTheDocument();

    rerender(
      <FileManager
        items={[]}
        renderEmpty={() => <div>No workspace files</div>}
      />,
    );

    expect(screen.getByText("No workspace files")).toBeInTheDocument();
  });
});

describe("FileManager utils", () => {
  it("filters and formats file metadata", () => {
    expect(filterFileManagerItems(items, "pdf")).toEqual([items[1]]);
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("sorts folders before files", () => {
    const sortedItems = sortFileManagerItems(items, {
      direction: "asc",
      key: "size",
    });

    expect(sortedItems.map((item) => item.name)).toEqual([
      "Archive",
      "Budget.xlsx",
      "Report.pdf",
    ]);
  });
});

