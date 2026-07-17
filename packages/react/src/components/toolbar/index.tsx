import { Toolbar } from "./Toolbar";
import type { ToolbarItem } from "./types";

const toolbarItems: ToolbarItem[] = [
  { id: "new", label: "New", variant: "primary" },
  { id: "upload", label: "Upload" },
  { id: "separator-1", type: "separator" },
  { id: "archive", label: "Archive", variant: "subtle" },
  { disabled: true, id: "delete", label: "Delete", variant: "danger" },
  { id: "filters", label: "Filters", pressed: true },
  {
    id: "view",
    items: [
      { id: "list", label: "List view", selected: true },
      { id: "grid", label: "Grid view" },
    ],
    label: "View",
    type: "menu",
  },
];

export function ToolbarExample() {
  return (
    <Toolbar
      ariaLabel="File commands"
      items={toolbarItems}
      overflow="scroll"
      overflowLabel="File commands scroll horizontally when space is limited"
      leading={<span className="px-2 text-sm font-medium text-gray-700">Files</span>}
      trailing={<span className="px-2 text-xs text-gray-500">6 selected</span>}
    >
      <input
        aria-label="Search files"
        className="min-h-9 w-40 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
        placeholder="Search files"
        type="search"
      />
    </Toolbar>
  );
}

export { Toolbar } from "./Toolbar";
export type {
  ToolbarActionItem,
  ToolbarItem,
  ToolbarItemVariant,
  ToolbarMenuOption,
  ToolbarMenuItem,
  ToolbarOrientation,
  ToolbarOverflow,
  ToolbarProps,
  ToolbarSeparatorItem,
  ToolbarSize,
} from "./types";

