import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TreeList } from "./TreeList";
import type { TreeListColumn } from "./types";
import { buildTreeListNodes, flattenVisibleTreeListRows } from "./utils";

type Employee = {
  id: string;
  managerId?: string;
  name: string;
  role: string;
};

const employees: Employee[] = [
  { id: "ceo", name: "Maya Chen", role: "CEO" },
  { id: "eng", managerId: "ceo", name: "Ava Johnson", role: "VP Engineering" },
  { id: "ops", managerId: "ceo", name: "Noah Singh", role: "VP Operations" },
  { id: "platform", managerId: "eng", name: "Elias Martin", role: "Platform Lead" },
];

const columns: TreeListColumn<Employee>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
];

const sortableColumns: TreeListColumn<Employee>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "role", header: "Role", sortable: true },
];

function renderTreeList(overrides = {}) {
  return render(
    <TreeList
      ariaLabel="Employee hierarchy"
      columns={columns}
      data={employees}
      getParentId={(employee) => employee.managerId}
      getRowId={(employee) => employee.id}
      {...overrides}
    />,
  );
}

describe("TreeList", () => {
  it("renders root rows and column headers", () => {
    renderTreeList();

    expect(screen.getByRole("treegrid", { name: "Employee hierarchy" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.queryByText("Ava Johnson")).not.toBeInTheDocument();
  });

  it("expands and collapses child rows", async () => {
    const user = userEvent.setup();

    renderTreeList();

    await user.click(screen.getByRole("button", { name: "Expand Maya Chen" }));

    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();
    expect(screen.getByText("Noah Singh")).toBeInTheDocument();
    expect(screen.queryByText("Elias Martin")).not.toBeInTheDocument();

    await user.click(within(screen.getByText("Ava Johnson").closest("tr") as HTMLElement).getByRole("button", { name: "Expand Ava Johnson" }));

    expect(screen.getByText("Elias Martin")).toBeInTheDocument();

    await user.click(within(screen.getByText("Maya Chen").closest("tr") as HTMLElement).getByRole("button", { name: "Collapse Maya Chen" }));

    expect(screen.queryByText("Ava Johnson")).not.toBeInTheDocument();
  });

  it("supports default expanded rows", () => {
    renderTreeList({ defaultExpandedRowIds: ["ceo", "eng"] });

    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();
    expect(screen.getByText("Elias Martin")).toBeInTheDocument();
  });

  it("supports controlled expanded rows", async () => {
    const user = userEvent.setup();
    const onExpandedRowIdsChange = vi.fn();

    renderTreeList({
      expandedRowIds: ["ceo"],
      onExpandedRowIdsChange,
    });

    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();

    await user.click(within(screen.getByText("Ava Johnson").closest("tr") as HTMLElement).getByRole("button", { name: "Expand Ava Johnson" }));

    expect(onExpandedRowIdsChange).toHaveBeenCalledWith(["ceo", "eng"]);
    expect(screen.queryByText("Elias Martin")).not.toBeInTheDocument();
  });

  it("renders custom cells with tree context", () => {
    const customColumns: TreeListColumn<Employee>[] = [
      { accessorKey: "name", header: "Name" },
      {
        header: "Depth",
        id: "depth",
        cell: ({ depth, hasChildren, isExpanded }) => `${depth}:${hasChildren}:${isExpanded}`,
      },
    ];

    renderTreeList({
      columns: customColumns,
      defaultExpandedRowIds: ["ceo"],
    });

    expect(screen.getByText("0:true:true")).toBeInTheDocument();
    expect(screen.getAllByText("1:true:false")).toHaveLength(1);
  });



  it("sorts sibling rows without flattening the hierarchy", async () => {
    const user = userEvent.setup();

    renderTreeList({
      columns: sortableColumns,
      defaultExpandedRowIds: ["ceo"],
    });

    await user.click(screen.getByRole("button", { name: "Sort by Name" }));

    const rows = screen.getAllByRole("row");

    expect(within(rows[1]).getByText("Maya Chen")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Ava Johnson")).toBeInTheDocument();
    expect(within(rows[3]).getByText("Noah Singh")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sort by Name, asc" }));

    const descendingRows = screen.getAllByRole("row");

    expect(within(descendingRows[1]).getByText("Maya Chen")).toBeInTheDocument();
    expect(within(descendingRows[2]).getByText("Noah Singh")).toBeInTheDocument();
    expect(within(descendingRows[3]).getByText("Ava Johnson")).toBeInTheDocument();
  });

  it("supports controlled sort state", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    renderTreeList({
      columns: sortableColumns,
      defaultExpandedRowIds: ["ceo"],
      onSortChange,
      sort: { columnId: "name", direction: "asc" },
    });

    await user.click(screen.getByRole("button", { name: "Sort by Name, asc" }));

    expect(onSortChange).toHaveBeenCalledWith({ columnId: "name", direction: "desc" });
  });

  it("filters rows and keeps ancestor paths by default", async () => {
    const user = userEvent.setup();

    renderTreeList({
      columns: sortableColumns,
      defaultExpandedRowIds: ["ceo", "eng"],
    });

    await user.type(screen.getByRole("searchbox", { name: "Search rows" }), "platform");

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();
    expect(screen.getByText("Elias Martin")).toBeInTheDocument();
    expect(screen.queryByText("Noah Singh")).not.toBeInTheDocument();
  });

  it("supports match-only filtering", async () => {
    const user = userEvent.setup();

    renderTreeList({
      columns: sortableColumns,
      defaultExpandedRowIds: ["ceo", "eng"],
      filterMode: "match-only",
    });

    await user.type(screen.getByRole("searchbox", { name: "Search rows" }), "platform");

    expect(screen.queryByText("Maya Chen")).not.toBeInTheDocument();
    expect(screen.queryByText("Ava Johnson")).not.toBeInTheDocument();
    expect(screen.getByText("Elias Martin")).toBeInTheDocument();
  });

  it("supports include-descendants filtering", async () => {
    const user = userEvent.setup();

    renderTreeList({
      columns: sortableColumns,
      defaultExpandedRowIds: ["ceo", "eng"],
      filterMode: "include-descendants",
    });

    await user.type(screen.getByRole("searchbox", { name: "Search rows" }), "engineering");

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();
    expect(screen.getByText("Elias Martin")).toBeInTheDocument();
  });

  it("supports controlled filtering", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    renderTreeList({
      columns: sortableColumns,
      filter: { global: "" },
      onFilterChange,
    });

    await user.type(screen.getByRole("searchbox", { name: "Search rows" }), "o");

    expect(onFilterChange).toHaveBeenCalledWith({ global: "o" });
    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.queryByText("Noah Singh")).not.toBeInTheDocument();
  });



  it("orders columns from column order state", () => {
    renderTreeList({
      columns: sortableColumns,
      defaultColumnOrder: ["role", "name"],
    });

    const headers = screen.getAllByRole("columnheader");

    expect(headers[0]).toHaveTextContent("Role");
    expect(headers[1]).toHaveTextContent("Name");
  });

  it("hides columns from column visibility state", () => {
    renderTreeList({
      columns: sortableColumns,
      defaultColumnVisibility: { role: false },
    });

    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /role/i })).not.toBeInTheDocument();
    expect(screen.queryByText("CEO")).not.toBeInTheDocument();
  });

  it("pins columns to the left and right", () => {
    renderTreeList({
      columns: [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "role", header: "Role" },
        { accessorFn: (employee: Employee) => employee.id, header: "ID", id: "id" },
      ],
      defaultColumnPinning: { left: ["role"], right: ["name"] },
    });

    const headers = screen.getAllByRole("columnheader");

    expect(headers[0]).toHaveTextContent("Role");
    expect(headers[1]).toHaveTextContent("ID");
    expect(headers[2]).toHaveTextContent("Name");
  });

  it("resizes columns with keyboard controls", async () => {
    const user = userEvent.setup();
    const onColumnSizingChange = vi.fn();

    renderTreeList({
      columns: [{ accessorKey: "name", header: "Name", width: 160 }, { accessorKey: "role", header: "Role" }],
      enableColumnResizing: true,
      onColumnSizingChange,
    });

    screen.getByRole("button", { name: "Resize Name column" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 170 });
  });

  it("loads children when an expandable row is opened", async () => {
    const user = userEvent.setup();
    const loadChildren = vi.fn().mockResolvedValue([
      { id: "remote-child", managerId: "ceo", name: "Remote Child", role: "Director" },
    ]);
    const onRowExpand = vi.fn();

    renderTreeList({
      data: [employees[0]],
      isRowExpandable: (employee: Employee) => employee.id === "ceo",
      loadChildren,
      onRowExpand,
    });

    await user.click(screen.getByRole("button", { name: "Expand Maya Chen" }));

    expect(loadChildren).toHaveBeenCalledWith(employees[0]);
    expect(onRowExpand).toHaveBeenCalledWith(employees[0]);
    expect(await screen.findByText("Remote Child")).toBeInTheDocument();
  });

  it("renders loading rows while children are loading", () => {
    renderTreeList({
      data: [employees[0]],
      expandedRowIds: ["ceo"],
      isRowExpandable: (employee: Employee) => employee.id === "ceo",
      loadingRowIds: ["ceo"],
      renderLoadingRow: (employee: Employee) => <span>Loading {employee.name}</span>,
    });

    expect(screen.getByText("Loading Maya Chen")).toBeInTheDocument();
  });

  it("calls collapse callback when an expanded row is closed", async () => {
    const user = userEvent.setup();
    const onRowCollapse = vi.fn();

    renderTreeList({
      defaultExpandedRowIds: ["ceo"],
      onRowCollapse,
    });

    await user.click(screen.getByRole("button", { name: "Collapse Maya Chen" }));

    expect(onRowCollapse).toHaveBeenCalledWith(employees[0]);
  });

  it("reports lazy loading errors", async () => {
    const user = userEvent.setup();
    const error = new Error("Network failed");
    const onError = vi.fn();

    renderTreeList({
      data: [employees[0]],
      errorMessage: "Could not load children.",
      isRowExpandable: (employee: Employee) => employee.id === "ceo",
      loadChildren: vi.fn().mockRejectedValue(error),
      onError,
    });

    await user.click(screen.getByRole("button", { name: "Expand Maya Chen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load children.");
    expect(onError).toHaveBeenCalledWith(error);
  });


  it("exposes sortable header aria-sort state", async () => {
    const user = userEvent.setup();

    renderTreeList({ columns: sortableColumns });

    await user.click(screen.getByRole("button", { name: "Sort by Name" }));

    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("button", { name: "Sort by Name, asc" })).toBeInTheDocument();
  });

  it("supports row keyboard navigation", async () => {
    const user = userEvent.setup();

    renderTreeList({ defaultExpandedRowIds: ["ceo"] });

    const rows = screen.getAllByRole("row");
    rows[1].focus();

    await user.keyboard("{ArrowDown}");

    expect(screen.getByText("Ava Johnson").closest("tr")).toHaveAttribute("tabindex", "0");

    await user.keyboard("{End}");

    expect(screen.getByText("Noah Singh").closest("tr")).toHaveAttribute("tabindex", "0");
  });

  it("expands and collapses focused rows with arrow keys", async () => {
    const user = userEvent.setup();

    renderTreeList();

    const rootRow = screen.getByText("Maya Chen").closest("tr") as HTMLElement;
    rootRow.focus();

    await user.keyboard("{ArrowRight}");

    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");

    expect(screen.queryByText("Ava Johnson")).not.toBeInTheDocument();
  });

  it("toggles focused row selection with keyboard", async () => {
    const user = userEvent.setup();

    renderTreeList({ selectionMode: "multiple" });

    const rootRow = screen.getByText("Maya Chen").closest("tr") as HTMLElement;
    rootRow.focus();
    await user.keyboard(" ");

    expect(screen.getByRole("checkbox", { name: "Select Maya Chen" })).toBeChecked();
  });

  it("supports single row selection", async () => {
    const user = userEvent.setup();

    renderTreeList({ defaultExpandedRowIds: ["ceo"], selectionMode: "single" });

    await user.click(screen.getByRole("checkbox", { name: "Select Maya Chen" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Ava Johnson" }));

    expect(screen.getByRole("checkbox", { name: "Select Maya Chen" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Ava Johnson" })).toBeChecked();
  });

  it("supports multiple row selection", async () => {
    const user = userEvent.setup();

    renderTreeList({ defaultExpandedRowIds: ["ceo"], selectionMode: "multiple" });

    await user.click(screen.getByRole("checkbox", { name: "Select Maya Chen" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Ava Johnson" }));

    expect(screen.getByRole("checkbox", { name: "Select Maya Chen" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Ava Johnson" })).toBeChecked();
  });

  it("supports controlled row selection", async () => {
    const user = userEvent.setup();
    const onSelectedRowIdsChange = vi.fn();

    renderTreeList({
      defaultExpandedRowIds: ["ceo"],
      onSelectedRowIdsChange,
      selectedRowIds: ["ceo"],
      selectionMode: "multiple",
    });

    expect(screen.getByRole("checkbox", { name: "Select Maya Chen" })).toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "Select Ava Johnson" }));

    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(["ceo", "eng"]);
    expect(screen.getByRole("checkbox", { name: "Select Ava Johnson" })).not.toBeChecked();
  });

  it("cascades parent selection to descendants", async () => {
    const user = userEvent.setup();

    renderTreeList({
      defaultExpandedRowIds: ["ceo", "eng"],
      enableCascadeSelection: true,
      selectionMode: "multiple",
    });

    await user.click(screen.getByRole("checkbox", { name: "Select Maya Chen" }));

    expect(screen.getByRole("checkbox", { name: "Select Maya Chen" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Ava Johnson" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Elias Martin" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Noah Singh" })).toBeChecked();
  });

  it("shows indeterminate parent state for partial cascade selection", async () => {
    const user = userEvent.setup();

    renderTreeList({
      defaultExpandedRowIds: ["ceo", "eng"],
      enableCascadeSelection: true,
      selectionMode: "multiple",
    });

    await user.click(screen.getByRole("checkbox", { name: "Select Elias Martin" }));

    expect(screen.getByRole("checkbox", { name: "Select Maya Chen" })).toBePartiallyChecked();
    expect(screen.getByRole("checkbox", { name: "Select Ava Johnson" })).toBePartiallyChecked();
  });

  it("renders an empty state", () => {
    renderTreeList({ data: [], renderEmpty: () => <span>No hierarchy yet.</span> });

    expect(screen.getByText("No hierarchy yet.")).toBeInTheDocument();
  });
});

describe("TreeList utils", () => {
  it("builds and flattens visible tree rows", () => {
    const nodes = buildTreeListNodes({
      data: employees,
      getParentId: (employee) => employee.managerId,
      getRowId: (employee) => employee.id,
    });

    expect(nodes).toHaveLength(1);
    expect(nodes[0].children).toHaveLength(2);

    const visibleRows = flattenVisibleTreeListRows(nodes, ["ceo", "eng"]);

    expect(visibleRows.map((row) => row.id)).toEqual(["ceo", "eng", "platform", "ops"]);
    expect(visibleRows.map((row) => row.depth)).toEqual([0, 1, 2, 1]);
  });
});
