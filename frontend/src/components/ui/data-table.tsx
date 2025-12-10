import { ReactNode } from "react";

type Column<T> = {
  header: string;
  accessor: (row: T) => ReactNode;
  width?: string;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  emptyText?: string;
};

export function DataTable<T>({ columns, data, emptyText = "No records" }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03]">
      <table className="min-w-full text-sm text-white/80">
        <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/60">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className="px-4 py-3 text-left font-semibold"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-white/40">
                {emptyText}
              </td>
            </tr>
          )}
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-white/5">
              {columns.map((column, colIndex) => (
                <td key={`${rowIndex}-${colIndex}-${column.header}`} className="px-4 py-4">
                  {column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

