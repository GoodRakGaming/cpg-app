interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  if (total <= pageSize) return null;

  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const hasPrev = page > 0;
  const hasNext = to < total;

  return (
    <div className="mt-4 flex items-center justify-end gap-3.5 text-sm text-muted">
      <span>
        {from}–{to} из {total}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-control border border-line bg-surface-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-surface-0"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-control border border-line bg-surface-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-surface-0"
      >
        ›
      </button>
    </div>
  );
}
