import { TreeList } from "./TreeList";
import type { TreeListColumn } from "./types";

type TeamMember = {
  id: string;
  managerId?: string;
  name: string;
  role: string;
  location: string;
};

const teamMembers: TeamMember[] = [
  { id: "ceo", name: "Maya Chen", role: "Chief Executive Officer", location: "London" },
  { id: "ops", managerId: "ceo", name: "Noah Singh", role: "VP Operations", location: "Berlin" },
  { id: "eng", managerId: "ceo", name: "Ava Johnson", role: "VP Engineering", location: "New York" },
  { id: "platform", managerId: "eng", name: "Elias Martin", role: "Platform Lead", location: "Dublin" },
  { id: "product", managerId: "eng", name: "Sofia Rossi", role: "Product Engineering Lead", location: "Milan" },
  { id: "support", managerId: "ops", name: "Lina Okafor", role: "Support Lead", location: "Lagos" },
];

const columns: TreeListColumn<TeamMember>[] = [
  { accessorKey: "name", header: "Name", width: 280 },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "location", header: "Location" },
];

export function TreeListExample() {
  return (
    <TreeList
      ariaLabel="Team hierarchy"
      columns={columns}
      data={teamMembers}
      defaultExpandedRowIds={["ceo", "eng"]}
      getParentId={(member) => member.managerId}
      getRowId={(member) => member.id}
    />
  );
}

export { TreeList } from "./TreeList";
export type {
  TreeListCellContext,
  TreeListColumn,
  TreeListColumnAlign,
  TreeListNode,
  TreeListProps,
  TreeListRowId,
  TreeListVisibleRow,
} from "./types";
