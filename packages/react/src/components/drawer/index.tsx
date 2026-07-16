import { useState } from "react";
import { Drawer } from "./Drawer";

export function DrawerExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
        onClick={() => setOpen(true)}
        type="button"
      >
        Open drawer
      </button>
      <Drawer
        actions={(
          <>
            <button className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700" onClick={() => setOpen(false)} type="button">
              Cancel
            </button>
            <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white" onClick={() => setOpen(false)} type="button">
              Save
            </button>
          </>
        )}
        description="Use drawers for contextual workflows that should keep the page visible."
        onOpenChange={setOpen}
        open={open}
        title="Edit workspace settings"
      >
        Drawer content can host forms, details panels, filters, previews, or side workflows.
      </Drawer>
    </div>
  );
}

export { Drawer } from "./Drawer";
export type { DrawerProps, DrawerSide, DrawerSize } from "./Drawer";
