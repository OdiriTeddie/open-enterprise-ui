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
            disabled={item.disabled}
            key={item.id}
            onClick={() => handleSelect(item)}
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
