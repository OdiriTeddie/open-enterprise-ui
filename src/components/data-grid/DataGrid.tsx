import type { DataGridProps } from "./types";
import {
  getAlignClass,
  getColumnId,
  getColumnStyle,
  getColumnValue,
} from "./utils";

export function DataGrid<T>({
  columns,
  data,
  loading = false,
  emptyMessage,
  getRowId,
}: DataGridProps<T>) {
  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading....</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={getColumnId(column)}
                className={`px-4 py-3 font-medium text-gray-700 ${getAlignClass(column)}`}
                style={getColumnStyle(column)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowId ? getRowId(row, rowIndex) : rowIndex}
                className="border-t border-gray-200"
              >
                {columns.map((column) => {
                  const value = getColumnValue(row, column);

                  return (
                    <td
                      key={getColumnId(column)}
                      className={`px-4 py-3 text-gray-700 ${getAlignClass(column)}`}
                      style={getColumnStyle(column)}
                    >
                      {column.cell
                        ? column.cell({ row, value, rowIndex, column })
                        : column.render
                          ? column.render(row)
                          : String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
