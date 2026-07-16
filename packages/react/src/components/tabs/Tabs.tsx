import { useId, useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type TabsOrientation = "horizontal" | "vertical";
export type TabsActivationMode = "automatic" | "manual";
export type TabValue = string;

export type TabItem = {
  disabled?: boolean;
  content: ReactNode;
  id?: string;
  label: ReactNode;
  value: TabValue;
};

export type TabsProps = {
  activationMode?: TabsActivationMode;
  ariaLabel?: string;
  className?: string;
  defaultValue?: TabValue;
  items: TabItem[];
  onValueChange?: (value: TabValue) => void;
  orientation?: TabsOrientation;
  value?: TabValue;
};

export function Tabs({
  activationMode = "automatic",
  ariaLabel = "Tabs",
  className = "",
  defaultValue,
  items,
  onValueChange,
  orientation = "horizontal",
  value,
}: TabsProps) {
  const generatedId = useId();
  const firstEnabledValue = items.find((item) => !item.disabled)?.value;
  const [internalValue, setInternalValue] = useState<TabValue | undefined>(defaultValue ?? firstEnabledValue);
  const currentValue = value ?? internalValue;
  const selectedItem = useMemo(
    () => items.find((item) => item.value === currentValue && !item.disabled) ?? items.find((item) => !item.disabled),
    [currentValue, items],
  );
  const selectedValue = selectedItem?.value;
  const enabledItems = items.filter((item) => !item.disabled);
  const isVertical = orientation === "vertical";

  function setSelectedValue(nextValue: TabValue) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function getTabId(item: TabItem) {
    return item.id ?? `${generatedId}-tab-${item.value}`;
  }

  function getPanelId(item: TabItem) {
    return `${getTabId(item)}-panel`;
  }

  function focusTab(nextValue: TabValue) {
    document.getElementById(`${generatedId}-button-${nextValue}`)?.focus();
  }

  function moveFocus(currentValue: TabValue, direction: 1 | -1) {
    if (enabledItems.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, enabledItems.findIndex((item) => item.value === currentValue));
    const nextItem = enabledItems[(currentIndex + direction + enabledItems.length) % enabledItems.length];

    focusTab(nextItem.value);

    if (activationMode === "automatic") {
      setSelectedValue(nextItem.value);
    }
  }

  function handleTabKeyDown(item: TabItem, event: KeyboardEvent<HTMLButtonElement>) {
    if (item.disabled) {
      return;
    }

    const previousKey = isVertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";

    if (event.key === previousKey) {
      event.preventDefault();
      moveFocus(item.value, -1);
    } else if (event.key === nextKey) {
      event.preventDefault();
      moveFocus(item.value, 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const firstItem = enabledItems[0];
      if (firstItem) {
        focusTab(firstItem.value);
        if (activationMode === "automatic") {
          setSelectedValue(firstItem.value);
        }
      }
    } else if (event.key === "End") {
      event.preventDefault();
      const lastItem = enabledItems[enabledItems.length - 1];
      if (lastItem) {
        focusTab(lastItem.value);
        if (activationMode === "automatic") {
          setSelectedValue(lastItem.value);
        }
      }
    } else if ((event.key === "Enter" || event.key === " ") && activationMode === "manual") {
      event.preventDefault();
      setSelectedValue(item.value);
    }
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`${isVertical ? "flex gap-4" : "space-y-4"} ${className}`}>
      <div
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={isVertical ? "flex min-w-44 flex-col gap-1" : "flex flex-wrap gap-1 border-b border-gray-200"}
        role="tablist"
      >
        {items.map((item) => {
          const isSelected = item.value === selectedValue;
          const tabId = getTabId(item);
          const panelId = getPanelId(item);

          return (
            <button
              aria-controls={panelId}
              aria-disabled={item.disabled || undefined}
              aria-selected={isSelected}
              className={`rounded-t-md px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-gray-300 ${
                isSelected ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } ${item.disabled ? "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-gray-600" : ""}`}
              disabled={item.disabled}
              id={`${generatedId}-button-${item.value}`}
              key={item.value}
              onClick={() => setSelectedValue(item.value)}
              onKeyDown={(event) => handleTabKeyDown(item, event)}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              <span id={tabId}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const isSelected = item.value === selectedValue;

        return (
          <div
            aria-labelledby={getTabId(item)}
            hidden={!isSelected}
            id={getPanelId(item)}
            key={item.value}
            role="tabpanel"
            tabIndex={0}
          >
            {isSelected ? item.content : null}
          </div>
        );
      })}
    </div>
  );
}
