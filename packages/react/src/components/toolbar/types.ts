import type { ReactNode } from "react";

export type ToolbarOrientation = "horizontal" | "vertical";
export type ToolbarSize = "sm" | "md";
export type ToolbarOverflow = "wrap" | "scroll";
export type ToolbarItemVariant = "default" | "primary" | "danger" | "subtle";

export type ToolbarActionItem = {
  disabled?: boolean;
  icon?: ReactNode;
  id: string;
  label: ReactNode;
  onSelect?: () => void;
  pressed?: boolean;
  tooltip?: string;
  type?: "action";
  variant?: ToolbarItemVariant;
};

export type ToolbarMenuOption = {
  disabled?: boolean;
  id: string;
  label: ReactNode;
  onSelect?: () => void;
  selected?: boolean;
};

export type ToolbarMenuItem = {
  disabled?: boolean;
  icon?: ReactNode;
  id: string;
  items: ToolbarMenuOption[];
  label: ReactNode;
  tooltip?: string;
  type: "menu";
  variant?: ToolbarItemVariant;
};

export type ToolbarSeparatorItem = {
  id: string;
  type: "separator";
};

export type ToolbarItem = ToolbarActionItem | ToolbarMenuItem | ToolbarSeparatorItem;

export type ToolbarProps = {
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
  items: ToolbarItem[];
  leading?: ReactNode;
  orientation?: ToolbarOrientation;
  overflow?: ToolbarOverflow;
  overflowLabel?: string;
  size?: ToolbarSize;
  trailing?: ReactNode;
};

