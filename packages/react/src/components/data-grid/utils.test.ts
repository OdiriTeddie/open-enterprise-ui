import { describe, expect, it } from "vitest";
import type { Column } from "./types";
import {
  clampPageIndex,
  filterRows,
  getPageCount,
  paginateRows,
  sortRows,
} from "./utils";

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
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" },
];

describe("data-grid utils", () => {
  it("filters rows by global text across columns", () => {
    const result = filterRows(users, columns, { global: "engineer" });

    expect(result).toEqual([users[0]]);
  });

  it("excludes non-filterable columns", () => {
    const result = filterRows(
      users,
      [
        { accessorKey: "name", header: "Name", filterable: false },
        { accessorKey: "role", header: "Role" },
      ],
      { global: "ada" },
    );

    expect(result).toEqual([]);
  });

  it("sorts rows by accessor value", () => {
    const result = sortRows(users, columns, {
      columnId: "name",
      direction: "desc",
    });

    expect(result.map((user) => user.name)).toEqual([
      "Katherine Johnson",
      "Grace Hopper",
      "Ada Lovelace",
    ]);
  });

  it("sorts rows by custom sort accessor", () => {
    const result = sortRows(
      users,
      [
        {
          id: "nameLength",
          header: "Name length",
          accessorFn: (user) => user.name,
          sortAccessor: (user) => user.id,
        },
      ],
      { columnId: "nameLength", direction: "asc" },
    );

    expect(result.map((user) => user.name)).toEqual([
      "Ada Lovelace",
      "Grace Hopper",
      "Katherine Johnson",
    ]);
  });

  it("paginates rows", () => {
    const result = paginateRows(users, { pageIndex: 1, pageSize: 2 });

    expect(result).toEqual([users[2]]);
  });

  it("calculates and clamps page indexes", () => {
    expect(getPageCount(21, 10)).toBe(3);
    expect(getPageCount(0, 10)).toBe(1);
    expect(clampPageIndex(5, 3)).toBe(2);
    expect(clampPageIndex(-1, 3)).toBe(0);
  });
});

