'use client';

import { useState } from 'react';
import Spinner from './Spinner';

function CompetitorRow({ competitor, onRefresh, refreshing }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{competitor.name}</p>
        {competitor.domain ? (
          <p className="truncate text-xs text-slate-400">{competitor.domain}</p>
        ) : null}
      </div>
      <button
        onClick={() => onRefresh(competitor)}
        disabled={refreshing}
        className="flex shrink-0 items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
      >
        {refreshing ? <Spinner className="h-3 w-3" /> : null}
        Refresh feed
      </button>
    </li>
  );
}

export default function CompetitorSetup({
  competitors,
  onDiscover,
  onAddManual,
  onRefreshCompetitor,
  refreshingId,
}) {
  const [tab, setTab] = useState('discover');
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [discoverNote, setDiscoverNote] = useState('');

  const [manual, setManual] = useState({ name: '', domain: '' });
  const [adding, setAdding] = useState(false);
  const [manualError, setManualError] = useState('');

  async function handleDiscover() {
    setDiscoverError('');
    setDiscoverNote('');
    setDiscovering(true);
    try {
      const result = await onDiscover();
      if (result?.ambiguous) {
        setDiscoverNote(
          "Cala couldn't confidently identify competitors. Try adding them manually below."
        );
        setTab('manual');
      } else {
        setDiscoverNote(`Discovered ${result?.competitors?.length || 0} competitor(s).`);
      }
    } catch (err) {
      setDiscoverError(err.message);
    } finally {
      setDiscovering(false);
    }
  }

  async function handleAddManual(e) {
    e.preventDefault();
    setManualError('');
    if (!manual.name.trim()) {
      setManualError('Competitor name is required.');
      return;
    }
    setAdding(true);
    try {
      await onAddManual(manual);
      setManual({ name: '', domain: '' });
    } catch (err) {
      setManualError(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Set up competitors</h2>
      <p className="mt-1 text-sm text-slate-500">
        Discover competitors automatically with Cala, or add them yourself.
      </p>

      <div className="mt-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <button
          onClick={() => setTab('discover')}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            tab === 'discover' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            tab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Add manually
        </button>
      </div>

      {tab === 'discover' ? (
        <div className="mt-4">
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {discovering ? <Spinner /> : null}
            {discovering ? 'Discovering…' : 'Discover competitors'}
          </button>
          {discoverNote ? <p className="mt-3 text-sm text-emerald-600">{discoverNote}</p> : null}
          {discoverError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{discoverError}</p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleAddManual} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={manual.name}
              onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
              placeholder="Competitor name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="text"
              value={manual.domain}
              onChange={(e) => setManual((m) => ({ ...m, domain: e.target.value }))}
              placeholder="domain.com (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          {manualError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{manualError}</p>
          ) : null}
          <button
            type="submit"
            disabled={adding}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {adding ? <Spinner /> : null}
            Add competitor
          </button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700">
          Competitors {competitors.length ? `(${competitors.length})` : ''}
        </h3>
        {competitors.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            No competitors yet. Discover or add one to start building your feed.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {competitors.map((c) => (
              <CompetitorRow
                key={c.id}
                competitor={c}
                onRefresh={onRefreshCompetitor}
                refreshing={refreshingId === c.id}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
