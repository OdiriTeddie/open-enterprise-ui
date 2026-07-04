import { render, screen, within } from "@testing-library/react";
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

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Katherine Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("resets to the first page when filtering changes", async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Katherine Johnson")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "ada");

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("calls controlled state change handlers", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onFilterChange = vi.fn();
    const onPaginationChange = vi.fn();

    render(
      <DataGrid
        columns={columns}
        data={users}
        emptyMessage="No users found."
        sort={null}
        filter={{ global: "" }}
        pagination={{ pageIndex: 0, pageSize: 2 }}
        onSortChange={onSortChange}
        onFilterChange={onFilterChange}
        onPaginationChange={onPaginationChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /name/i }));
    await user.type(screen.getByRole("searchbox"), "ada");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onSortChange).toHaveBeenCalledWith({
      columnId: "name",
      direction: "asc",
    });
    expect(onFilterChange).toHaveBeenCalledWith({ global: "a" });
    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 2,
    });
  });
});
