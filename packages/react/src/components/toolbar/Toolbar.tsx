import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ToolbarActionItem, ToolbarItem, ToolbarMenuItem, ToolbarMenuOption, ToolbarOrientation, ToolbarOverflow, ToolbarProps } from "./types";

const overflowClasses: Record<ToolbarOrientation, Record<ToolbarOverflow, string>> = {
  horizontal: {
    scroll: "flex-row flex-nowrap items-center overflow-x-auto",
    wrap: "flex-row flex-wrap items-center",
  },
  vertical: {
    scroll: "max-h-full flex-col flex-nowrap items-stretch overflow-y-auto",
    wrap: "flex-col items-stretch",
  },
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
  return item.type === undefined || item.type === "action";
}

function isMenuItem(item: ToolbarItem): item is ToolbarMenuItem {
  return item.type === "menu";
}

function isFocusableItem(item: ToolbarItem): item is ToolbarActionItem | ToolbarMenuItem {
  return item.type !== "separator";
}

export function Toolbar({
  ariaLabel = "Toolbar",
  className = "",
  items,
  leading,
  orientation = "horizontal",
  overflow = "wrap",
  overflowLabel,
  size = "md",
  trailing,
}: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isVertical = orientation === "vertical";
  const enabledActionItems = useMemo(() => items.filter((item): item is ToolbarActionItem | ToolbarMenuItem => isFocusableItem(item) && !item.disabled), [items]);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [focusedMenuOptionId, setFocusedMenuOptionId] = useState<string | null>(null);
  const activeFocusableItemId = focusedItemId && enabledActionItems.some((item) => item.id === focusedItemId)
    ? focusedItemId
    : enabledActionItems[0]?.id;

  useEffect(() => {
    function handleDocumentPointerDown(event: PointerEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
        setFocusedMenuOptionId(null);
      }
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => document.removeEventListener("pointerdown", handleDocumentPointerDown);
  }, []);

  function focusItem(itemId: string) {
    setFocusedItemId(itemId);
    document.querySelector<HTMLElement>(`[data-toolbar-item-id="${CSS.escape(itemId)}"]`)?.focus();
  }

  function focusMenuOption(optionId: string) {
    setFocusedMenuOptionId(optionId);
    document.querySelector<HTMLElement>(`[data-toolbar-menu-option-id="${CSS.escape(optionId)}"]`)?.focus();
  }

  function getEnabledMenuOptions(item: ToolbarMenuItem) {
    return item.items.filter((option) => !option.disabled);
  }

  function openMenu(item: ToolbarMenuItem, focus: "first" | "last" = "first") {
    if (item.disabled) {
      return;
    }

    const enabledOptions = getEnabledMenuOptions(item);
    const nextOption = focus === "last" ? enabledOptions[enabledOptions.length - 1] : enabledOptions[0];

    setOpenMenuId(item.id);

    if (nextOption) {
      window.setTimeout(() => focusMenuOption(nextOption.id), 0);
    }
  }

  function closeMenu({ restoreFocus = true }: { restoreFocus?: boolean } = {}) {
    const previousMenuId = openMenuId;

    setOpenMenuId(null);
    setFocusedMenuOptionId(null);

    if (restoreFocus && previousMenuId) {
      window.setTimeout(() => focusItem(previousMenuId), 0);
    }
  }

  function moveFocus(currentItem: ToolbarActionItem | ToolbarMenuItem, direction: 1 | -1) {
    if (enabledActionItems.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, enabledActionItems.findIndex((item) => item.id === currentItem.id));
    const nextItem = enabledActionItems[(currentIndex + direction + enabledActionItems.length) % enabledActionItems.length];

    focusItem(nextItem.id);
  }

  function handleActionKeyDown(item: ToolbarActionItem | ToolbarMenuItem, event: KeyboardEvent<HTMLButtonElement>) {
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
    } else if (isMenuItem(item) && event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(item);
    } else if (isMenuItem(item) && event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(item, "last");
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (isMenuItem(item)) {
        if (openMenuId === item.id) {
          closeMenu();
        } else {
          openMenu(item);
        }
      } else {
        handleSelect(item);
      }
    } else if (event.key === "Escape" && openMenuId) {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleMenuOptionKeyDown(item: ToolbarMenuItem, option: ToolbarMenuOption, event: KeyboardEvent<HTMLButtonElement>) {
    const enabledOptions = getEnabledMenuOptions(item);
    const currentIndex = Math.max(0, enabledOptions.findIndex((entry) => entry.id === option.id));

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextOption = enabledOptions[(currentIndex + 1) % enabledOptions.length];
      focusMenuOption(nextOption.id);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const previousOption = enabledOptions[(currentIndex - 1 + enabledOptions.length) % enabledOptions.length];
      focusMenuOption(previousOption.id);
    } else if (event.key === "Home") {
      event.preventDefault();
      const firstOption = enabledOptions[0];
      if (firstOption) {
        focusMenuOption(firstOption.id);
      }
    } else if (event.key === "End") {
      event.preventDefault();
      const lastOption = enabledOptions[enabledOptions.length - 1];
      if (lastOption) {
        focusMenuOption(lastOption.id);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMenuOptionSelect(option);
    }
  }

  function handleSelect(item: ToolbarActionItem) {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
  }

  function handleMenuOptionSelect(option: ToolbarMenuOption) {
    if (option.disabled) {
      return;
    }

    option.onSelect?.();
    closeMenu();
  }

  function renderActionButton(item: ToolbarActionItem | ToolbarMenuItem) {
    const isMenu = isMenuItem(item);
    const isOpen = isMenu && openMenuId === item.id;

    return (
      <button
        aria-expanded={isMenu ? isOpen : undefined}
        aria-haspopup={isMenu ? "menu" : undefined}
        aria-pressed={isActionItem(item) ? item.pressed : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-medium outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonSizeClasses[size]} ${variantClasses[item.variant ?? "default"]}`}
        data-toolbar-item-id={item.id}
        disabled={item.disabled}
        key={item.id}
        onClick={() => {
          if (isMenu) {
            if (isOpen) {
              closeMenu();
            } else {
              openMenu(item);
            }
          } else {
            handleSelect(item);
          }
        }}
        onFocus={() => setFocusedItemId(item.id)}
        onKeyDown={(event) => handleActionKeyDown(item, event)}
        tabIndex={item.disabled ? -1 : item.id === activeFocusableItemId ? 0 : -1}
        title={item.tooltip}
        type="button"
      >
        {item.icon ? <span aria-hidden="true" className="shrink-0">{item.icon}</span> : null}
        <span>{item.label}</span>
        {isMenu ? <span aria-hidden="true" className="text-xs">v</span> : null}
      </button>
    );
  }

  function renderMenu(item: ToolbarMenuItem) {
    if (openMenuId !== item.id) {
      return null;
    }

    const enabledOptions = getEnabledMenuOptions(item);
    const activeOptionId = focusedMenuOptionId && enabledOptions.some((option) => option.id === focusedMenuOptionId)
      ? focusedMenuOptionId
      : enabledOptions[0]?.id;

    return (
      <div
        aria-label={`${String(item.label)} menu`}
        className="absolute left-0 top-full z-50 mt-1 min-w-40 rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg"
        role="menu"
      >
        {item.items.map((option) => (
          <button
            aria-checked={option.selected}
            className="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            data-toolbar-menu-option-id={option.id}
            disabled={option.disabled}
            key={option.id}
            onClick={() => handleMenuOptionSelect(option)}
            onKeyDown={(event) => handleMenuOptionKeyDown(item, option, event)}
            role={option.selected === undefined ? "menuitem" : "menuitemcheckbox"}
            tabIndex={option.disabled ? -1 : option.id === activeOptionId ? 0 : -1}
            type="button"
          >
            <span>{option.label}</span>
            {option.selected ? <span aria-hidden="true">check</span> : null}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      aria-description={overflow === "scroll" ? overflowLabel : undefined}
      aria-orientation={orientation}
      className={`flex rounded-md border border-gray-200 bg-white ${overflowClasses[orientation][overflow]} ${sizeClasses[size]} ${className}`}
      ref={toolbarRef}
      role="toolbar"
    >
      {leading ? <div className={isVertical ? "mb-1" : "mr-1"}>{leading}</div> : null}

      {items.map((item) => {
        if (!isFocusableItem(item)) {
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
          <div className="relative" key={item.id}>
            {renderActionButton(item)}
            {isMenuItem(item) ? renderMenu(item) : null}
          </div>
        );
      })}

      {trailing ? <div className={isVertical ? "mt-1" : "ml-auto"}>{trailing}</div> : null}
    </div>
  );
}
