import { useState } from "react";
import { Dialog } from "./Dialog";

export function DialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
        onClick={() => setOpen(true)}
        type="button"
      >
        Open dialog
      </button>
      <Dialog
        actions={(
          <>
            <button className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700" onClick={() => setOpen(false)} type="button">
              Cancel
            </button>
            <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white" onClick={() => setOpen(false)} type="button">
              Confirm
            </button>
          </>
        )}
        description="Use dialogs for focused decisions and short workflows."
        onOpenChange={setOpen}
        open={open}
        title="Review changes"
      >
        This dialog keeps focus inside while it is open and returns focus to the trigger when closed.
      </Dialog>
    </div>
  );
}

export { Dialog } from "./Dialog";
export type { DialogProps, DialogSize } from "./Dialog";
