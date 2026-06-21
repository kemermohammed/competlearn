'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import RegistrationForm from '@/components/RegistrationForm';
import CompetitorSetup from '@/components/CompetitorSetup';
import Feed from '@/components/Feed';
import Spinner from '@/components/Spinner';

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [company, setCompany] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [feed, setFeed] = useState([]);
  const [aiMode, setAiMode] = useState(null);

  const [refreshingId, setRefreshingId] = useState(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [banner, setBanner] = useState(null);

  const loadCompetitorsAndFeed = useCallback(async (companyId) => {
    const [comp, fd] = await Promise.all([
      api.getCompetitors(companyId),
      api.getFeed(companyId),
    ]);
    setCompetitors(comp.competitors || []);
    setFeed(fd.items || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [{ company: existing }, health] = await Promise.all([
          api.getCurrentCompany(),
          api.health().catch(() => null),
        ]);
        if (health) setAiMode(health.ai_mode);
        if (existing) {
          setCompany(existing);
          await loadCompetitorsAndFeed(existing.id);
        }
      } catch (err) {
        setBanner({ type: 'error', text: err.message });
      } finally {
        setBooting(false);
      }
    })();
  }, [loadCompetitorsAndFeed]);

  async function handleRegister(form) {
    const { company: created } = await api.register(form);
    setCompany(created);
    await loadCompetitorsAndFeed(created.id);
  }

  async function handleDiscover() {
    const result = await api.discoverCompetitors(company.id);
    await loadCompetitorsAndFeed(company.id);
    return result;
  }

  async function handleAddManual(form) {
    await api.addCompetitor(company.id, form);
    await loadCompetitorsAndFeed(company.id);
  }

  async function handleRefreshCompetitor(competitor) {
    setRefreshingId(competitor.id);
    setBanner(null);
    try {
      await api.refreshCompetitor(competitor.id);
      const fd = await api.getFeed(company.id);
      setFeed(fd.items || []);
      setBanner({ type: 'success', text: `Refreshed feed for ${competitor.name}.` });
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleRefreshAll() {
    setRefreshingAll(true);
    setBanner(null);
    try {
      const result = await api.refreshAll(company.id);
      const fd = await api.getFeed(company.id);
      setFeed(fd.items || []);
      if (result.errors && result.errors.length) {
        setBanner({
          type: 'error',
          text: `Refreshed ${result.refreshed}, but ${result.errors.length} failed: ${result.errors[0].error}`,
        });
      } else {
        setBanner({ type: 'success', text: `Refreshed ${result.refreshed} competitor(s).` });
      }
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setRefreshingAll(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              cL
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">competiLearn</h1>
              <p className="text-xs text-slate-400">Competitor intelligence, verified by Cala</p>
            </div>
          </div>
          {aiMode ? (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                aiMode === 'live'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              }`}
            >
              {aiMode === 'live' ? 'Live AI' : 'Mock AI'}
            </span>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {booting ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
            <Spinner className="h-5 w-5" /> Loading…
          </div>
        ) : !company ? (
          <RegistrationForm onRegister={handleRegister} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Tracking competitors for</p>
                <h2 className="text-2xl font-semibold tracking-tight">{company.name}</h2>
                {company.domain ? (
                  <p className="text-sm text-slate-400">{company.domain}</p>
                ) : null}
              </div>
              <button
                onClick={handleRefreshAll}
                disabled={refreshingAll || competitors.length === 0}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshingAll ? <Spinner /> : null}
                {refreshingAll ? 'Refreshing…' : 'Refresh all'}
              </button>
            </div>

            {banner ? (
              <p
                className={`rounded-lg px-4 py-2.5 text-sm ${
                  banner.type === 'error'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {banner.text}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              <div>
                <CompetitorSetup
                  competitors={competitors}
                  onDiscover={handleDiscover}
                  onAddManual={handleAddManual}
                  onRefreshCompetitor={handleRefreshCompetitor}
                  refreshingId={refreshingId}
                />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Intelligence feed</h2>
                  <span className="text-xs text-slate-400">
                    {feed.length} card{feed.length === 1 ? '' : 's'}
                  </span>
                </div>
                <Feed items={feed} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
