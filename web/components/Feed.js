'use client';

import FeedCard from './FeedCard';

export default function Feed({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-600">Your feed is empty</p>
        <p className="mt-1 text-sm text-slate-400">
          Refresh a competitor (or use “Refresh all”) to generate intelligence cards.
        </p>
      </div>
    );
  }

  return (
    <div className="feed-scroll max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}
