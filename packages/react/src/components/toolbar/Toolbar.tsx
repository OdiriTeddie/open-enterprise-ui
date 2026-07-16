import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ToolbarActionItem, ToolbarItem, ToolbarProps } from "./types";

const orientationClasses = {
  horizontal: "flex-row flex-wrap items-center",
  vertical: "flex-col items-stretch",
};

const sizeClasses = {
  md: "gap-2 p-2 text-sm",
  sm: "gap-1 p-1 text-xs",
};

const buttonSizeClasses = {
  md: "min-h-9 px-3 py-2",
  sm: "min-h-8 px-2 py-1.5",
};

const variantClasses = {
  danger: "text-red-700 hover:bg-red-50 focus:ring-red-200 aria-pressed:bg-red-100",
  default: "text-gray-700 hover:bg-gray-100 focus:ring-gray-300 aria-pressed:bg-gray-200",
  primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-300 aria-pressed:bg-gray-700",
  subtle: "text-gray-600 hover:bg-gray-50 focus:ring-gray-200 aria-pressed:bg-gray-100",
};

function isActionItem(item: ToolbarItem): item is ToolbarActionItem {
  return item.type !== "separator";
}

export function Toolbar({
  ariaLabel = "Toolbar",
  className = "",
  items,
  leading,
  orientation = "horizontal",
  size = "md",
  trailing,
}: ToolbarProps) {
  const isVertical = orientation === "vertical";
  const enabledActionItems = useMemo(() => items.filter((item): item is ToolbarActionItem => isActionItem(item) && !item.disabled), [items]);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const activeFocusableItemId = focusedItemId && enabledActionItems.some((item) => item.id === focusedItemId)
    ? focusedItemId
    : enabledActionItems[0]?.id;

  function focusItem(itemId: string) {
    setFocusedItemId(itemId);
    document.querySelector<HTMLElement>(`[data-toolbar-item-id="${CSS.escape(itemId)}"]`)?.focus();
  }

  function moveFocus(currentItem: ToolbarActionItem, direction: 1 | -1) {
    if (enabledActionItems.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, enabledActionItems.findIndex((item) => item.id === currentItem.id));
    const nextItem = enabledActionItems[(currentIndex + direction + enabledActionItems.length) % enabledActionItems.length];

    focusItem(nextItem.id);
  }

  function handleActionKeyDown(item: ToolbarActionItem, event: KeyboardEvent<HTMLButtonElement>) {
    const previousKey = isVertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";

    if (event.key === previousKey) {
      event.preventDefault();
      moveFocus(item, -1);
    } else if (event.key === nextKey) {
      event.preventDefault();
      moveFocus(item, 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const firstItem = enabledActionItems[0];
      if (firstItem) {
        focusItem(firstItem.id);
      }
    } else if (event.key === "End") {
      event.preventDefault();
      const lastItem = enabledActionItems[enabledActionItems.length - 1];
      if (lastItem) {
        focusItem(lastItem.id);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(item);
    }
  }

  function handleSelect(item: ToolbarActionItem) {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
  }

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={`flex rounded-md border border-gray-200 bg-white ${orientationClasses[orientation]} ${sizeClasses[size]} ${className}`}
      role="toolbar"
    >
      {leading ? <div className={isVertical ? "mb-1" : "mr-1"}>{leading}</div> : null}

      {items.map((item) => {
        if (!isActionItem(item)) {
          return (
            <div
              aria-orientation={orientation}
              className={isVertical ? "my-1 h-px w-full bg-gray-200" : "mx-1 h-6 w-px bg-gray-200"}
              key={item.id}
              role="separator"
            />
          );
        }

        return (
          <button
            aria-pressed={item.pressed}
            className={`inline-flex items-center justify-center gap-2 rounded-md font-medium outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonSizeClasses[size]} ${variantClasses[item.variant ?? "default"]}`}
            data-toolbar-item-id={item.id}
            disabled={item.disabled}
            key={item.id}
            onClick={() => handleSelect(item)}
            onFocus={() => setFocusedItemId(item.id)}
            onKeyDown={(event) => handleActionKeyDown(item, event)}
            tabIndex={item.disabled ? -1 : item.id === activeFocusableItemId ? 0 : -1}
            title={item.tooltip}
            type="button"
          >
            {item.icon ? <span aria-hidden="true" className="shrink-0">{item.icon}</span> : null}
            <span>{item.label}</span>
          </button>
        );
      })}

      {trailing ? <div className={isVertical ? "mt-1" : "ml-auto"}>{trailing}</div> : null}
    </div>
  );
}
