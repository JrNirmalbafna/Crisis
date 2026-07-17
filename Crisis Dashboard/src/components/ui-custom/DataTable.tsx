import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Database } from "lucide-react";
import { cn } from "../../utils";
import { GlassCard } from "./GlassCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  exportable = true,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExport = () => {
    console.log("Exporting table data to CSV...");
    // CSV export logic would go here
  };

  const isEmpty = !isLoading && data.length === 0;
  const hasNoResults = !isLoading && data.length > 0 && table.getRowModel().rows.length === 0;

  return (
    <GlassCard padding="none" className={cn("flex flex-col h-full", className)}>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      {(searchable || exportable) && (
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04] shrink-0 gap-4">
          {searchable ? (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          ) : (
            <div /> // spacer
          )}

          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      )}

      {/* ── Table Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto relative" style={{ scrollbarWidth: "thin" }}>
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0B1728]/95 backdrop-blur-md sticky top-0 z-10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="h-11 px-4 align-middle font-medium uppercase tracking-wider text-[10px] text-white/50 whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 select-none",
                            header.column.getCanSort()
                              ? "cursor-pointer hover:text-white/90 transition-colors"
                              : ""
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="shrink-0">
                              {{
                                asc: <ArrowUp className="w-3 h-3 text-blue-400" />,
                                desc: <ArrowDown className="w-3 h-3 text-blue-400" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ArrowUpDown className="w-3 h-3 text-white/20" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-white/[0.04]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length} className="p-4">
                    <LoadingSkeleton variant="row" />
                  </td>
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 align-middle text-white/90"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>

        {/* ── Empty States ────────────────────────────────────────────────── */}
        {!isLoading && isEmpty && (
          <div className="p-8">
            <EmptyState icon={Database} title="No Records Found" description="The dataset is currently empty." />
          </div>
        )}

        {!isLoading && hasNoResults && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-white/60">No results match your search.</p>
            <button 
              onClick={() => setGlobalFilter("")}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 border-t border-white/[0.04] shrink-0 bg-white/[0.01]">
        <div className="text-[11px] text-white/40 font-mono tracking-widest uppercase">
          Showing {table.getRowModel().rows.length} of {data.length} records
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white/70 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <div className="text-[11px] text-white/60 font-mono px-2">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </div>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white/70 hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { DataTable } from "@/components/ui-custom/DataTable";
// <DataTable columns={columns} data={data} isLoading={false} searchable exportable />
