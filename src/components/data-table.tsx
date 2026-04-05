"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { useState } from "react"
import { IconButton } from "@/components/ui/icon-button"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100, "All"] as const
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

function resolvePageSize(opt: PageSizeOption): number {
  return opt === "All" ? Number.MAX_SAFE_INTEGER : opt
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  defaultPageSize?: PageSizeOption
  defaultSorting?: SortingState
  pagination?: boolean
}

export function DataTable<T>({
  columns,
  data,
  defaultPageSize = 20,
  defaultSorting = [],
  pagination = true,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting)
  const [pageIndex, setPageIndex] = useState(0)
  const [prevData, setPrevData] = useState(data)
  if (prevData !== data) {
    setPrevData(data)
    setPageIndex(0)
  }
  const [pageSizeOption, setPageSizeOption] =
    useState<PageSizeOption>(defaultPageSize)
  const pageSize =
    pagination === false
      ? Number.MAX_SAFE_INTEGER
      : resolvePageSize(pageSizeOption)

  // Warning message is sufficient to identify future upgrade
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: (updater) => {
      setSorting(updater)
      setPageIndex(0)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  })

  const { rows } = table.getRowModel()
  const totalRows = table.getFilteredRowModel().rows.length
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(pageIndex * pageSize + pageSize, totalRows)
  const pageCount = table.getPageCount()
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  return (
    <div className="flex flex-col gap-2">
      <div className="table-container">
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
          <thead className="table-head">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "table-head-cell",
                        canSort && "cursor-pointer hover:text-foreground",
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort &&
                          (sorted === "asc" ? (
                            <ArrowUpIcon className="h-3 w-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="h-3 w-3" />
                          ) : (
                            <ArrowUpDownIcon className="h-3 w-3 text-muted-foreground" />
                          ))}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="table-body">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="table-row group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="table-cell">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination !== false && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Left: count */}
          <span className="tabular-nums">
            {totalRows === 0
              ? "No results"
              : `Showing ${from}–${to} of ${totalRows}`}
          </span>

          {/* Center: prev / indicator / next */}
          <div className="flex items-center gap-2">
            <IconButton
              onClick={() => setPageIndex((p) => p - 1)}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </IconButton>
            <span className="tabular-nums">
              {pageCount === 0 ? "—" : `${pageIndex + 1} / ${pageCount}`}
            </span>
            <IconButton
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={!canNext}
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </IconButton>
          </div>

          {/* Right: page size */}
          <div className="flex items-center gap-1">
            <span>Rows:</span>
            <Select
              value={pageSizeOption}
              onChange={(e) => {
                const val = e.target.value
                const numVal = Number(val)
                const isAll = val === "All"
                const isValidNum =
                  !Number.isNaN(numVal) &&
                  ([10, 20, 30, 50, 100] as const).includes(
                    numVal as 10 | 20 | 30 | 50 | 100,
                  )
                const opt: PageSizeOption = isAll
                  ? "All"
                  : isValidNum
                    ? (numVal as 10 | 20 | 30 | 50 | 100)
                    : defaultPageSize
                setPageSizeOption(opt)
                setPageIndex(0)
              }}
              className="pl-2 pr-6 py-0.5 text-sm ml-1"
            >
              {PAGE_SIZE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
