import { Toolbar } from "./Toolbar";
import type { ToolbarItem } from "./types";

const toolbarItems: ToolbarItem[] = [
  { id: "new", label: "New", variant: "primary" },
  { id: "upload", label: "Upload" },
  { id: "separator-1", type: "separator" },
  { id: "archive", label: "Archive", variant: "subtle" },
  { disabled: true, id: "delete", label: "Delete", variant: "danger" },
  { id: "filters", label: "Filters", pressed: true },
];

export function ToolbarExample() {
  return (
    <Toolbar
      ariaLabel="File commands"
      items={toolbarItems}
      leading={<span className="px-2 text-sm font-medium text-gray-700">Files</span>}
      trailing={<span className="px-2 text-xs text-gray-500">6 selected</span>}
    />
  );
}

export { Toolbar } from "./Toolbar";
export type {
  ToolbarActionItem,
  ToolbarItem,
  ToolbarItemVariant,
  ToolbarOrientation,
  ToolbarProps,
  ToolbarSeparatorItem,
  ToolbarSize,
} from "./types";
