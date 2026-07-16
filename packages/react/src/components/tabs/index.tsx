import { Tabs } from "./Tabs";

export function TabsExample() {
  return (
    <Tabs
      ariaLabel="Workspace tabs"
      items={[
        {
          content: <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-700">Overview metrics and workspace health.</div>,
          label: "Overview",
          value: "overview",
        },
        {
          content: <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-700">Members, roles, and access requests.</div>,
          label: "Members",
          value: "members",
        },
        {
          content: <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-700">Audit log and system events.</div>,
          label: "Audit",
          value: "audit",
        },
      ]}
    />
  );
}

export { Tabs } from "./Tabs";
export type { TabItem, TabsActivationMode, TabsOrientation, TabsProps, TabValue } from "./Tabs";
