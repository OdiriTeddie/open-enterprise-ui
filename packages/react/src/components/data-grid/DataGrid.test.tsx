import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "./DataGrid";
import type { Column } from "./types";

type User = {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Invited";
};

const users: User[] = [
  { id: 1, name: "Ada Lovelace", role: "Engineer", status: "Active" },
  { id: 2, name: "Grace Hopper", role: "Admin", status: "Invited" },
  { id: 3, name: "Katherine Johnson", role: "Analyst", status: "Active" },
];

const columns: Column<User>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "role", header: "Role", sortable: true },
  { accessorKey: "status", header: "Status" },
];

function renderGrid() {
  return render(
    <DataGrid
      columns={columns}
      data={users}
      emptyMessage="No users found."
      getRowId={(user) => user.id}
      defaultPagination={{ pageIndex: 0, pageSize: 2 }}
      pageSizeOptions={[2, 3]}
      enableRowSelection
    />,
  );
}

describe("DataGrid", () => {
  it("filters rows with the global search input", async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.type(screen.getByRole("searchbox"), "grace");

    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
    expect(screen.queryByText("Katherine Johnson")).not.toBeInTheDocument();
  });

  it("sorts rows when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole("button", { name: /name/i }));
    await user.click(screen.getByRole("button", { name: /name/i }));

    const bodyRows = within(screen.getAllByRole("rowgroup")[1]).getAllByRole(
      "row",
    );

    expect(bodyRows[0]).toHaveTextContent("Katherine Johnson");
    expect(bodyRows[1]).toHaveTextContent("Grace Hopper");
  });

  it("paginates rows with next and previous controls", async () => {
    const user = userEvent.setup();
    renderGrid();

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Katherine Johnson")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to next page" }));

    expect(screen.getByText("Katherine Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to previous page" }));

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("shows row range text and jumps to first and last pages", async () => {
    const user = userEvent.setup();
    renderGrid();

    expect(screen.getByText("1-2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to last page" }));

    expect(screen.getByText("3-3 of 3")).toBeInTheDocument();
    expect(screen.getByText("Katherine Johnson")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to first page" }));

    expect(screen.getByText("1-2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("hides pagination when it is not needed", () => {
    render(
      <DataGrid
        columns={columns}
        data={[users[0]]}
        emptyMessage="No users found."
        pageSizeOptions={[10]}
      />,
    );

    expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Go to next page" }),
    ).not.toBeInTheDocument();
  });

  it("resets to the first page when filtering changes", async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(screen.getByText("Katherine Johnson")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "ada");

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("exposes accessible labels and status regions", async () => {
    const user = userEvent.setup();
    render(
      <DataGrid
        ariaLabel="Users table"
        columns={columns}
        data={users}
        emptyMessage="No users found."
        getRowId={(row) => row.id}
        defaultPagination={{ pageIndex: 0, pageSize: 2 }}
        pageSizeOptions={[2, 3]}
        enableRowSelection
      />,
    );

    expect(screen.getByRole("table", { name: "Users table" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select row 1" }));

    expect(
      screen.getByRole("checkbox", { name: "Select all visible rows" }),
    ).toHaveAttribute("aria-checked", "mixed");

    await user.type(screen.getByRole("searchbox"), "no-match");

    expect(screen.getByRole("status")).toHaveTextContent(
      "No matching rows found.",
    );
  });
  it("renders custom loading, empty, and no-results states", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DataGrid
        columns={columns}
        data={[]}
        loading
        renderLoading={() => <span>Fetching users</span>}
      />,
    );

    expect(screen.getByText("Fetching users")).toBeInTheDocument();

    rerender(
      <DataGrid
        columns={columns}
        data={[]}
        renderEmpty={() => <span>No users yet</span>}
      />,
    );

    expect(screen.getByText("No users yet")).toBeInTheDocument();

    rerender(
      <DataGrid
        columns={columns}
        data={users}
        renderNoResults={() => <span>No users matched your search</span>}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "no-match");

    expect(screen.getByText("No users matched your search")).toBeInTheDocument();
  });
  it("selects and deselects a row", async () => {
    const user = userEvent.setup();
    renderGrid();

    const rowCheckbox = screen.getByRole("checkbox", { name: "Select row 1" });

    await user.click(rowCheckbox);
    expect(rowCheckbox).toBeChecked();

    await user.click(rowCheckbox);
    expect(rowCheckbox).not.toBeChecked();
  });

  it("selects and deselects all visible rows", async () => {
    const user = userEvent.setup();
    renderGrid();

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: "Select all visible rows",
    });

    await user.click(selectAllCheckbox);

    expect(screen.getByRole("checkbox", { name: "Select row 1" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select row 2" })).toBeChecked();

    await user.click(selectAllCheckbox);

    expect(
      screen.getByRole("checkbox", { name: "Select row 1" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Select row 2" }),
    ).not.toBeChecked();
  });

  it("preserves selected rows across pages", async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    await user.click(screen.getByRole("checkbox", { name: "Select row 3" }));
    await user.click(screen.getByRole("button", { name: "Go to previous page" }));

    expect(screen.getByRole("checkbox", { name: "Select row 1" })).toBeChecked();
  });


  it("renders columns in the configured order", () => {
    render(
      <DataGrid
        columns={columns}
        data={users}
        columnOrder={["status", "name", "role"]}
        pageSizeOptions={[10]}
      />,
    );

    const headerCells = screen.getAllByRole("columnheader");

    expect(headerCells[0]).toHaveTextContent("Status");
    expect(headerCells[1]).toHaveTextContent("Name");
    expect(headerCells[2]).toHaveTextContent("Role");
  });

  it("appends columns that are missing from the configured order", () => {
    render(
      <DataGrid
        columns={columns}
        data={users}
        columnOrder={["role"]}
        pageSizeOptions={[10]}
      />,
    );

    const headerCells = screen.getAllByRole("columnheader");

    expect(headerCells[0]).toHaveTextContent("Role");
    expect(headerCells[1]).toHaveTextContent("Name");
    expect(headerCells[2]).toHaveTextContent("Status");
  });


  it("renders columns in the default column order", () => {
    render(
      <DataGrid
        columns={columns}
        data={users}
        defaultColumnOrder={["role", "status", "name"]}
        pageSizeOptions={[10]}
      />,
    );

    const headerCells = screen.getAllByRole("columnheader");

    expect(headerCells[0]).toHaveTextContent("Role");
    expect(headerCells[1]).toHaveTextContent("Status");
    expect(headerCells[2]).toHaveTextContent("Name");
  });

  it("hides columns from default visibility state", () => {
    render(
      <DataGrid
        columns={columns}
        data={users}
        defaultColumnVisibility={{ role: false }}
        pageSizeOptions={[10]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Role" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Engineer")).not.toBeInTheDocument();
  });

  it("toggles column visibility and calls controlled visibility changes", async () => {
    const user = userEvent.setup();
    const onColumnVisibilityChange = vi.fn();

    render(
      <DataGrid
        columns={columns}
        data={users}
        columnVisibility={{ role: true }}
        enableColumnVisibility
        onColumnVisibilityChange={onColumnVisibilityChange}
        pageSizeOptions={[10]}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Role" }));

    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ role: false });
  });
  it("resizes columns with keyboard controls", () => {
    render(
      <DataGrid
        columns={columns}
        data={users}
        defaultColumnSizing={{ name: 180 }}
        enableColumnResizing
        pageSizeOptions={[10]}
      />,
    );

    const resizeHandle = screen.getByRole("button", {
      name: "Resize Name column",
    });
    const nameHeader = resizeHandle.closest("th");

    expect(nameHeader).toHaveStyle({ width: "180px" });

    fireEvent.keyDown(resizeHandle, { key: "ArrowRight" });

    expect(nameHeader).toHaveStyle({ width: "190px" });
  });

  it("calls controlled column sizing changes", () => {
    const onColumnSizingChange = vi.fn();

    render(
      <DataGrid
        columns={columns}
        data={users}
        columnSizing={{ name: 180 }}
        enableColumnResizing
        onColumnSizingChange={onColumnSizingChange}
        pageSizeOptions={[10]}
      />,
    );

    fireEvent.keyDown(
      screen.getByRole("button", { name: "Resize Name column" }),
      { key: "ArrowLeft" },
    );

    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 170 });
  });

  it("leaves rows untouched in server mode", () => {
    render(
      <DataGrid
        columns={columns}
        data={users}
        mode="server"
        rowCount={30}
        filter={{ global: "grace" }}
        sort={{ columnId: "name", direction: "desc" }}
        pagination={{ pageIndex: 1, pageSize: 1 }}
        pageSizeOptions={[1]}
      />,
    );

    const bodyRows = within(screen.getAllByRole("rowgroup")[1]).getAllByRole(
      "row",
    );

    expect(bodyRows).toHaveLength(3);
    expect(bodyRows[0]).toHaveTextContent("Ada Lovelace");
    expect(bodyRows[1]).toHaveTextContent("Grace Hopper");
    expect(bodyRows[2]).toHaveTextContent("Katherine Johnson");
  });

  it("uses server row counts for pagination metadata", async () => {
    const user = userEvent.setup();
    const onPaginationChange = vi.fn();

    render(
      <DataGrid
        columns={columns}
        data={[users[0], users[1]]}
        mode="server"
        rowCount={30}
        pagination={{ pageIndex: 1, pageSize: 10 }}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={[10]}
      />,
    );

    expect(screen.getByText("11-12 of 30")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to next page" }));

    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 2,
      pageSize: 10,
    });
  });

  it("calls controlled state change handlers", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onFilterChange = vi.fn();
    const onPaginationChange = vi.fn();
    const onRowSelectionChange = vi.fn();

    render(
      <DataGrid
        columns={columns}
        data={users}
        emptyMessage="No users found."
        getRowId={(user) => user.id}
        sort={null}
        filter={{ global: "" }}
        pagination={{ pageIndex: 0, pageSize: 2 }}
        onSortChange={onSortChange}
        onFilterChange={onFilterChange}
        onPaginationChange={onPaginationChange}
        enableRowSelection
        selectedRowIds={[]}
        onRowSelectionChange={onRowSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /name/i }));
    await user.type(screen.getByRole("searchbox"), "ada");
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    await user.click(screen.getByRole("checkbox", { name: "Select row 1" }));

    expect(onSortChange).toHaveBeenCalledWith({
      columnId: "name",
      direction: "asc",
    });
    expect(onFilterChange).toHaveBeenCalledWith({ global: "a" });
    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 2,
    });
    expect(onRowSelectionChange).toHaveBeenCalledWith([1]);
  });
});


