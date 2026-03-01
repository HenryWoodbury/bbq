"use client";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100, "All"] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

function resolvePageSize(opt: PageSizeOption): number {
  return opt === "All" ? Number.MAX_SAFE_INTEGER : opt;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  defaultPageSize?: PageSizeOption;
}

export function DataTable<T>({ columns, data, defaultPageSize = 20 }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizeOption, setPageSizeOption] = useState<PageSizeOption>(defaultPageSize);
  const pageSize = resolvePageSize(pageSizeOption);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPageIndex(0);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const { rows } = table.getRowModel();
  const totalRows = table.getFilteredRowModel().rows.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(pageIndex * pageSize + pageSize, totalRows);
  const pageCount = table.getPageCount();
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {table.getFlatHeaders().map((header) => (
              <col
                key={header.id}
                style={{
                  width: `${(header.column.getSize() / table.getCenterTotalSize()) * 100}%`,
                }}
              />
            ))}
          </colgroup>
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      className={[
                        "px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 select-none overflow-hidden text-ellipsis whitespace-nowrap",
                        canSort ? "cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300" : "",
                      ].join(" ")}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          sorted === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-zinc-400"
                >
                  No data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        {/* Left: count */}
        <span className="tabular-nums">
          {totalRows === 0
            ? "No results"
            : `Showing ${from}–${to} of ${totalRows}`}
        </span>

        {/* Center: prev / indicator / next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageIndex((p) => p - 1)}
            disabled={!canPrev}
            className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            {pageCount === 0 ? "—" : `${pageIndex + 1} / ${pageCount}`}
          </span>
          <button
            onClick={() => setPageIndex((p) => p + 1)}
            disabled={!canNext}
            className="rounded p-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Right: page size */}
        <div className="flex items-center gap-1">
          <span>Rows:</span>
          <select
            value={pageSizeOption}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = Number(val);
              const isAll = val === "All";
              const isValidNum = !isNaN(numVal) && ([20, 30, 50, 100] as const).includes(numVal as 20 | 30 | 50 | 100);
              const opt: PageSizeOption = isAll ? "All" : isValidNum ? (numVal as 20 | 30 | 50 | 100) : defaultPageSize;
              setPageSizeOption(opt);
              setPageIndex(0);
            }}
            className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PAGE_SIZE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
