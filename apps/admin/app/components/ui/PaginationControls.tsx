"use client";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

function buildVisiblePages(page: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);

  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
}

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  limit,
  itemLabel,
  onPageChange,
}: Props) {
  if (totalItems <= 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);
  const visiblePages = buildVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Menampilkan {startItem}-{endItem} dari {totalItems} {itemLabel}.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>

        {visiblePages.map((pageNumber, index) => {
          const previousPage = visiblePages[index - 1];
          const showGap = previousPage && pageNumber - previousPage > 1;

          return (
            <div key={pageNumber} className="flex items-center gap-2">
              {showGap ? (
                <span className="px-1 text-sm text-gray-400">...</span>
              ) : null}

              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  pageNumber === page
                    ? "bg-black text-white"
                    : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
