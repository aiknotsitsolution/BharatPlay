import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PAGINATION_OPTIONS } from "../../utils/paginationConfig";

/**
 * Pagination bar for lists that are NOT react-data-table tables (card grids,
 * feed lists, channel pickers…). It mirrors RDT's built-in pagination so every
 * paginated list in the panel looks and behaves the same: a centered bar with
 * rows-per-page, a "1–20 of 120" range, and first/prev/next/last buttons.
 *
 * Props:
 *   pagination   { page, totalPages, total?, limit? } (server pagination object)
 *   onPageChange (page: number) => void
 *   onLimitChange (rowsPerPage: number) => void   ← optional (shows the selector)
 *   total        total row count (falls back to pagination.total)
 *   limit        current rows-per-page (falls back to pagination.limit)
 */
export default function ListPagination({
  pagination,
  onPageChange,
  onLimitChange,
  total,
  limit,
  options = PAGINATION_OPTIONS,
}) {
  const page = pagination?.page || 1;
  const totalPages = Math.max(1, pagination?.totalPages || 1);
  const rowCount = total ?? pagination?.total ?? 0;
  const rowsPerPage = limit ?? pagination?.limit ?? 0;

  if (totalPages <= 1) return null;

  const start = rowsPerPage ? (page - 1) * rowsPerPage + 1 : 1;
  const end = rowsPerPage ? Math.min(page * rowsPerPage, rowCount) : rowCount;
  const range = rowCount
    ? `${start}–${end} of ${rowCount}`
    : `Page ${page} of ${totalPages}`;

  const btn =
    "inline-flex items-center justify-center w-8 h-8 rounded-md text-bp-text-secondary hover:bg-bp-elevated hover:text-bp-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 border-t border-bp-border">
      {onLimitChange && rowsPerPage > 0 && (
        <label className="flex items-center gap-2 text-xs text-bp-text-muted">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-8 rounded-md border border-bp-border bg-transparent px-2 text-xs text-bp-text-secondary focus:outline-none focus:ring-2 focus:ring-bp-blue/30"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="text-xs text-bp-text-muted tabular-nums">{range}</p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="First page"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className={btn}
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={btn}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={btn}
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          aria-label="Last page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className={btn}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
