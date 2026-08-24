export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
      >
        Prev
      </button>
      {start > 1 && <span className="px-2 text-slate-400">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 text-sm rounded border ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 hover:bg-slate-50"}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-2 text-slate-400">…</span>}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
      >
        Next
      </button>
    </div>
  );
}
