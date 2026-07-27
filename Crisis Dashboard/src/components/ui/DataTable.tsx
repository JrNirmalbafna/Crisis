import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "../../utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Table container with glassmorphism */}
      <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-[12px] overflow-hidden flex-1">
        <div className="w-full overflow-auto" style={{ scrollbarWidth: "thin" }}>
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.03] text-white/50 border-b border-white/[0.06]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="h-10 px-4 align-middle font-medium uppercase tracking-wider text-[11px]"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              header.column.getCanSort() &&
                                "cursor-pointer select-none hover:text-white/80 transition-colors"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ArrowUp className="w-3 h-3 text-blue-400" />,
                              desc: <ArrowDown className="w-3 h-3 text-blue-400" />,
                            }[header.column.getIsSorted() as string] ??
                              (header.column.getCanSort() ? (
                                <ArrowUpDown className="w-3 h-3 text-white/20" />
                              ) : null)}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/[0.02] transition-colors data-[state=selected]:bg-white/[0.04]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle text-white/90">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-white/40">
                      <span className="text-sm">No results found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-[11px] text-white/40 font-mono tracking-widest uppercase">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
