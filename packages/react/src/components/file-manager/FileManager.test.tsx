import { render, screen, waitFor } from "@testing-library/react";
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







