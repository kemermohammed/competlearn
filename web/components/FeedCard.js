'use client';

function formatTime(ts) {
  if (!ts) return '';
  // SQLite datetime('now') returns UTC without a timezone marker.
  const date = new Date(ts.includes('T') ? ts : `${ts.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FeedCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{item.competitor_name}</h3>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {item.is_mock ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
              Mock AI — add OPENAI_API_KEY for live insights
            </span>
          ) : null}
          <span className="text-xs text-slate-400">{formatTime(item.created_at)}</span>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            What happened
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.what_happened}</p>
        </div>

        <div className="rounded-xl bg-indigo-50/70 p-3 ring-1 ring-inset ring-indigo-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
            Why it matters
          </p>
          <p className="mt-1 text-sm leading-relaxed text-indigo-900">{item.why_it_matters}</p>
        </div>

        <div className="rounded-xl bg-emerald-50/70 p-3 ring-1 ring-inset ring-emerald-100">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9.664 1.319a.75.75 0 01.672 0 41.06 41.06 0 018.198 5.424.75.75 0 01-.254 1.285 31.37 31.37 0 00-7.86 3.83.75.75 0 01-.84 0 31.371 31.371 0 00-4.823-2.68V8.6a31.4 31.4 0 015.421-2.7.75.75 0 00-.504-1.413 32.9 32.9 0 00-6.591 3.396.75.75 0 00.087 1.31 29.86 29.86 0 011.183.518V11.5a.75.75 0 001.5 0V9.66a31.3 31.3 0 015.084 2.66.75.75 0 00.84 0 32.87 32.87 0 018.231-4.014.75.75 0 00-.254-1.285A41.06 41.06 0 009.664 1.32z"
                clipRule="evenodd"
              />
            </svg>
            Consider
          </p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900">{item.consider}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {item.source_url ? (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Source: Cala ✓
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Source: Cala ✓
          </span>
        )}
      </div>
    </article>
  );
}
