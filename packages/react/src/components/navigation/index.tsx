import { Navigation } from "./Navigation";

export function NavigationExample() {
  return (
    <Navigation
      ariaLabel="Workspace navigation"
      className="max-w-xs rounded-md border border-gray-200 p-2"
      items={[
        {
          label: "Workspace",
          items: [
            { label: "Overview", value: "overview" },
            { badge: "4", label: "Tasks", value: "tasks" },
            { label: "Reports", value: "reports" },
          ],
        },
        {
          label: "Admin",
          items: [
            { label: "Members", value: "members" },
            { disabled: true, label: "Billing", value: "billing" },
          ],
        },
      ]}
    />
  );
}

export { Navigation } from "./Navigation";
export type { NavigationEntry, NavigationGroup, NavigationItem, NavigationOrientation, NavigationProps, NavigationValue } from "./Navigation";
