import {
  DataGridExample,
  ServerSideDataGridExample,
} from "./components/data-grid";
import { DialogExample } from "./components/dialog";
import { DrawerExample } from "./components/drawer";
import { FileManagerExample } from "./components/file-manager";
import { FormExample } from "./components/form";
import { TabsExample } from "./components/tabs";

function App() {
  return (
    <main className="space-y-8 p-8">
      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          Tabs
        </h1>
        <TabsExample />
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          Dialog
        </h1>
        <DialogExample />
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          Drawer
        </h1>
        <DrawerExample />
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          Form primitives
        </h1>
        <FormExample />
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          File Manager
        </h1>
        <FileManagerExample />
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          Client-side DataGrid
        </h1>
        <DataGridExample />
      </section>

      <section>
        <h1 className="mb-3 text-xl font-semibold text-gray-900">
          Server-side DataGrid
        </h1>
        <ServerSideDataGridExample />
      </section>
    </main>
  );
}

export default App;

