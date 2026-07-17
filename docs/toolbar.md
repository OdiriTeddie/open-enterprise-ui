# Toolbar API

`Toolbar` renders a compact command surface for enterprise workflows such as file actions, grid commands, filters, and contextual page actions.

## Import

```tsx
import { Toolbar, type ToolbarItem } from "@open-enterprise-ui/react";
```

## Basic Usage

```tsx
const items: ToolbarItem[] = [
  { id: "new", label: "New", variant: "primary", onSelect: createItem },
  { id: "upload", label: "Upload", onSelect: uploadFiles },
  { id: "separator", type: "separator" },
  { id: "filters", label: "Filters", pressed: true },
  { id: "delete", label: "Delete", variant: "danger", disabled: true },
  {
    id: "view",
    type: "menu",
    label: "View",
    items: [
      { id: "list", label: "List view", selected: true },
      { id: "grid", label: "Grid view", onSelect: setGridView },
    ],
  },
];

<Toolbar ariaLabel="File commands" items={items} />;
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `ToolbarItem[]` | Action and separator items. |
| `ariaLabel` | `string` | Accessible toolbar label. Defaults to `"Toolbar"`. |
| `orientation` | `"horizontal" \| "vertical"` | Toolbar orientation. Defaults to `"horizontal"`. |
| `overflow` | `"wrap" \| "scroll"` | Controls item overflow. Defaults to `"wrap"`. |
| `overflowLabel` | `string` | Optional description exposed when scroll overflow is enabled. |
| `size` | `"sm" \| "md"` | Button density. Defaults to `"md"`. |
| `leading` | `ReactNode` | Optional content before toolbar items. |
| `trailing` | `ReactNode` | Optional content after toolbar items. |
| `children` | `ReactNode` | Optional composed controls rendered between toolbar items and trailing content. |
| `className` | `string` | Additional class names for the root toolbar. |

## Items

```ts
type ToolbarActionItem = {
  id: string;
  type?: "action";
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "subtle";
  pressed?: boolean;
  tooltip?: string;
  onSelect?: () => void;
};

type ToolbarMenuOption = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

type ToolbarMenuItem = {
  id: string;
  type: "menu";
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "subtle";
  tooltip?: string;
  items: ToolbarMenuOption[];
};

type ToolbarSeparatorItem = {
  id: string;
  type: "separator";
};
```

## Composition

Use `children` when the command bar needs custom controls that are not toolbar actions, such as search inputs, filter chips, status controls, or density switches.

```tsx
<Toolbar
  ariaLabel="File commands"
  items={items}
  leading={<span>Files</span>}
  trailing={<span>6 selected</span>}
>
  <input aria-label="Search files" type="search" />
</Toolbar>
```
## Accessibility

`Toolbar` renders `role="toolbar"` with `aria-orientation`. Separators render `role="separator"`. Pressed action items expose `aria-pressed`.

Keyboard behavior:

- `ArrowRight` / `ArrowLeft` move focus in horizontal toolbars.
- `ArrowDown` / `ArrowUp` move focus in vertical toolbars.
- `Home` moves focus to the first enabled action.
- `End` moves focus to the last enabled action.
- `Enter` and `Space` activate the focused action or open a focused menu.
- `ArrowDown` opens a focused menu and focuses the first option.
- `ArrowUp` opens a focused menu and focuses the last option.
- Open menus use `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`, `Space`, and `Escape`.
- Disabled actions, disabled menu options, and separators are skipped.
- Outside clicks close open menus.

`overflow="wrap"` allows commands to wrap onto additional lines. `overflow="scroll"` keeps commands in a single row or column and enables scrolling. Measured overflow into an automatic ?More? menu is planned as a follow-up phase.



## Integration Examples

### DataGrid Command Bar

Use `Toolbar` above `DataGrid` when page-level commands need to coordinate with grid state. Keep the grid state in the consuming app and pass it to both components.

```tsx
function AccountsGrid() {
  const [filter, setFilter] = useState<FilterState>({ global: "" });
  const [selectedRowIds, setSelectedRowIds] = useState<RowId[]>([]);

  const items: ToolbarItem[] = [
    { id: "export", label: "Export", variant: "primary", onSelect: exportRows },
    { id: "assign", label: "Assign", disabled: selectedRowIds.length === 0 },
    { id: "separator", type: "separator" },
    { id: "risk", label: "At risk", pressed: filter.global === "At risk", onSelect: () => setFilter({ global: "At risk" }) },
    { id: "clear", label: "Clear", variant: "subtle", onSelect: () => setFilter({ global: "" }) },
  ];

  return (
    <>
      <Toolbar
        ariaLabel="Account grid commands"
        items={items}
        trailing={<span>{selectedRowIds.length} selected</span>}
      >
        <input
          aria-label="Search accounts"
          onChange={(event) => setFilter({ global: event.target.value })}
          type="search"
          value={filter.global}
        />
      </Toolbar>

      <DataGrid
        columns={columns}
        data={accounts}
        enableRowSelection
        filter={filter}
        onFilterChange={setFilter}
        onRowSelectionChange={setSelectedRowIds}
        selectedRowIds={selectedRowIds}
        showGlobalFilter={false}
      />
    </>
  );
}
```

### FileManager Command Bar

Use a Toolbar when file commands should sit outside the FileManager chrome or match the rest of an application shell.

```tsx
function FilesWorkspace() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<FileManagerItemId[]>([]);
  const [viewMode, setViewMode] = useState<FileManagerViewMode>("list");

  const items: ToolbarItem[] = [
    { id: "upload", label: "Upload", variant: "primary", onSelect: openUploadDialog },
    { id: "folder", label: "New folder", onSelect: createFolder },
    { id: "separator", type: "separator" },
    { id: "list", label: "List", pressed: viewMode === "list", onSelect: () => setViewMode("list") },
    { id: "grid", label: "Grid", pressed: viewMode === "grid", onSelect: () => setViewMode("grid") },
    { id: "download", label: "Download", disabled: selectedIds.length === 0 },
  ];

  return (
    <>
      <Toolbar
        ariaLabel="File manager commands"
        items={items}
        trailing={<span>{selectedIds.length} selected</span>}
      >
        <input
          aria-label="Search files"
          onChange={(event) => setSearchValue(event.target.value)}
          type="search"
          value={searchValue}
        />
      </Toolbar>

      <FileManager
        items={files}
        onSearchChange={setSearchValue}
        onSelectionChange={({ selectedIds }) => setSelectedIds(selectedIds)}
        onViewModeChange={setViewMode}
        searchValue={searchValue}
        selectedIds={selectedIds}
        viewMode={viewMode}
      />
    </>
  );
}
```

## Overflow

```tsx
<Toolbar
  ariaLabel="Grid commands"
  items={items}
  overflow="scroll"
  overflowLabel="Grid commands scroll horizontally when space is limited"
/>
```

