import { useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type NavigationOrientation = "horizontal" | "vertical";
export type NavigationValue = string;

export type NavigationItem = {
  badge?: ReactNode;
  disabled?: boolean;
  href?: string;
  icon?: ReactNode;
  label: ReactNode;
  value: NavigationValue;
};

export type NavigationGroup = {
  items: NavigationItem[];
  label?: ReactNode;
};

export type NavigationEntry = NavigationItem | NavigationGroup;

export type NavigationProps = {
  ariaLabel?: string;
  className?: string;
  defaultValue?: NavigationValue;
  items: NavigationEntry[];
  onValueChange?: (value: NavigationValue, item: NavigationItem) => void;
  orientation?: NavigationOrientation;
  value?: NavigationValue;
};

function isGroup(entry: NavigationEntry): entry is NavigationGroup {
  return "items" in entry;
}

export function Navigation({
  ariaLabel = "Navigation",
  className = "",
  defaultValue,
  items,
  onValueChange,
  orientation = "vertical",
  value,
}: NavigationProps) {
  const flatItems = useMemo(() => items.flatMap((entry) => (isGroup(entry) ? entry.items : [entry])), [items]);
  const firstEnabledValue = flatItems.find((item) => !item.disabled)?.value;
  const [internalValue, setInternalValue] = useState<NavigationValue | undefined>(defaultValue ?? firstEnabledValue);
  const currentValue = value ?? internalValue;
  const enabledItems = flatItems.filter((item) => !item.disabled);
  const isVertical = orientation === "vertical";

  function selectItem(item: NavigationItem) {
    if (item.disabled) {
      return;
    }

    if (value === undefined) {
      setInternalValue(item.value);
    }

    onValueChange?.(item.value, item);
  }

  function focusItem(nextValue: NavigationValue) {
    document.querySelector<HTMLElement>(`[data-navigation-value="${CSS.escape(nextValue)}"]`)?.focus();
  }

  function moveFocus(currentItem: NavigationItem, direction: 1 | -1) {
    if (enabledItems.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, enabledItems.findIndex((item) => item.value === currentItem.value));
    const nextItem = enabledItems[(currentIndex + direction + enabledItems.length) % enabledItems.length];

    focusItem(nextItem.value);
  }

  function handleItemKeyDown(item: NavigationItem, event: KeyboardEvent<HTMLElement>) {
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
      const firstItem = enabledItems[0];
      if (firstItem) {
        focusItem(firstItem.value);
      }
    } else if (event.key === "End") {
      event.preventDefault();
      const lastItem = enabledItems[enabledItems.length - 1];
      if (lastItem) {
        focusItem(lastItem.value);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectItem(item);
    }
  }

  function renderItem(item: NavigationItem) {
    const isActive = item.value === currentValue;
    const commonProps = {
      "aria-current": isActive ? "page" as const : undefined,
      "data-navigation-value": item.value,
      className: `flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
        isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      } ${item.disabled ? "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-gray-700" : ""}`,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleItemKeyDown(item, event),
      tabIndex: item.disabled ? -1 : 0,
    };
    const content = (
      <>
        <span className="flex min-w-0 items-center gap-2">
          {item.icon ? <span aria-hidden="true" className="shrink-0">{item.icon}</span> : null}
          <span className="truncate">{item.label}</span>
        </span>
        {item.badge ? <span className="shrink-0 text-xs opacity-80">{item.badge}</span> : null}
      </>
    );

    if (item.href && !item.disabled) {
      return (
        <a href={item.href} key={item.value} onClick={() => selectItem(item)} {...commonProps}>
          {content}
        </a>
      );
    }

    return (
      <button disabled={item.disabled} key={item.value} onClick={() => selectItem(item)} type="button" {...commonProps}>
        {content}
      </button>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={className}>
      <div className={isVertical ? "space-y-4" : "flex flex-wrap items-center gap-2"}>
        {items.map((entry, index) => {
          if (!isGroup(entry)) {
            return renderItem(entry);
          }

          return (
            <section className={isVertical ? "space-y-1" : "flex items-center gap-2"} key={`${index}-${String(entry.label ?? "group")}`}>
              {entry.label ? <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{entry.label}</h2> : null}
              <div className={isVertical ? "space-y-1" : "flex items-center gap-2"}>{entry.items.map(renderItem)}</div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
