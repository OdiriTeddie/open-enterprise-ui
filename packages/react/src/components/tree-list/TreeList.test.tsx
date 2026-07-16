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

    await user.click(screen.getByRole("button", { name: "Expand row" }));

    expect(screen.getByText("Ava Johnson")).toBeInTheDocument();
    expect(screen.getByText("Noah Singh")).toBeInTheDocument();
    expect(screen.queryByText("Elias Martin")).not.toBeInTheDocument();

    await user.click(within(screen.getByText("Ava Johnson").closest("tr") as HTMLElement).getByRole("button", { name: "Expand row" }));

    expect(screen.getByText("Elias Martin")).toBeInTheDocument();

    await user.click(within(screen.getByText("Maya Chen").closest("tr") as HTMLElement).getByRole("button", { name: "Collapse row" }));

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

    await user.click(within(screen.getByText("Ava Johnson").closest("tr") as HTMLElement).getByRole("button", { name: "Expand row" }));

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


  it("supports single row selection", async () => {
    const user = userEvent.setup();

    renderTreeList({ defaultExpandedRowIds: ["ceo"], selectionMode: "single" });

    await user.click(screen.getByRole("checkbox", { name: "Select row ceo" }));
    await user.click(screen.getByRole("checkbox", { name: "Select row eng" }));

    expect(screen.getByRole("checkbox", { name: "Select row ceo" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select row eng" })).toBeChecked();
  });

  it("supports multiple row selection", async () => {
    const user = userEvent.setup();

    renderTreeList({ defaultExpandedRowIds: ["ceo"], selectionMode: "multiple" });

    await user.click(screen.getByRole("checkbox", { name: "Select row ceo" }));
    await user.click(screen.getByRole("checkbox", { name: "Select row eng" }));

    expect(screen.getByRole("checkbox", { name: "Select row ceo" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select row eng" })).toBeChecked();
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

    expect(screen.getByRole("checkbox", { name: "Select row ceo" })).toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "Select row eng" }));

    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(["ceo", "eng"]);
    expect(screen.getByRole("checkbox", { name: "Select row eng" })).not.toBeChecked();
  });

  it("cascades parent selection to descendants", async () => {
    const user = userEvent.setup();

    renderTreeList({
      defaultExpandedRowIds: ["ceo", "eng"],
      enableCascadeSelection: true,
      selectionMode: "multiple",
    });

    await user.click(screen.getByRole("checkbox", { name: "Select row ceo" }));

    expect(screen.getByRole("checkbox", { name: "Select row ceo" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select row eng" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select row platform" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select row ops" })).toBeChecked();
  });

  it("shows indeterminate parent state for partial cascade selection", async () => {
    const user = userEvent.setup();

    renderTreeList({
      defaultExpandedRowIds: ["ceo", "eng"],
      enableCascadeSelection: true,
      selectionMode: "multiple",
    });

    await user.click(screen.getByRole("checkbox", { name: "Select row platform" }));

    expect(screen.getByRole("checkbox", { name: "Select row ceo" })).toBePartiallyChecked();
    expect(screen.getByRole("checkbox", { name: "Select row eng" })).toBePartiallyChecked();
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
