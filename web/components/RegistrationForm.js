'use client';

import { useState } from 'react';
import Spinner from './Spinner';

export default function RegistrationForm({ onRegister }) {
  const [form, setForm] = useState({ name: '', domain: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Please enter your company name.');
      return;
    }
    setLoading(true);
    try {
      await onRegister(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Register your company</h2>
        <p className="mt-2 text-sm text-slate-500">
          Tell us about your company. We&apos;ll find competitors and build your intelligence feed.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Company name</label>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Acme Inc."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Domain</label>
            <input
              type="text"
              value={form.domain}
              onChange={update('domain')}
              placeholder="acme.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="What does your company do?"
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Registering…' : 'Register company'}
          </button>
        </form>
      </div>
    </div>
  );
}
