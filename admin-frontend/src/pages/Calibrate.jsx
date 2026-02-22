import React, { useState, useCallback } from 'react';
import {
  Crosshair, Search, CheckCircle, AlertCircle,
  Clock, Info, Zap,
} from 'lucide-react';
import { getAdminUsers, calibrateUser } from '../api/client';
import Header from '../components/Header';
import Badge from '../components/Badge';

/* ── Job history entry ───────────────────────────────────────────────────────── */
function HistoryEntry({ entry }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {entry.status === 'success'
        ? <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
        : <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{entry.name}</p>
        <p className="text-xs text-slate-500">{entry.email}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`badge text-xs ${
          entry.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {entry.status === 'success' ? 'Queued' : 'Failed'}
        </span>
        <p className="text-xs text-slate-400 mt-1">{entry.time}</p>
      </div>
    </div>
  );
}

export default function Calibrate() {
  const [search,     setSearch]     = useState('');
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [searchErr,  setSearchErr]  = useState('');
  const [calStates,  setCalStates]  = useState({});  // userId → 'loading'|'done'|'error'
  const [history,    setHistory]    = useState([]);
  const [bulkIds,    setBulkIds]    = useState(new Set());

  const doSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true); setSearchErr('');
    try {
      const res = await getAdminUsers({ page: 1, limit: 20, search });
      setResults(res.data.data ?? []);
      if ((res.data.data ?? []).length === 0) setSearchErr('No users found for that query.');
    } catch (err) {
      setSearchErr(err.response?.data?.message ?? 'Search failed.');
    } finally {
      setSearching(false); }
  }, [search]);

  const runCalibrate = async (user) => {
    setCalStates((s) => ({ ...s, [user._id]: 'loading' }));
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    try {
      await calibrateUser(user._id);
      setCalStates((s) => ({ ...s, [user._id]: 'done' }));
      setHistory((h) => [{ ...user, status: 'success', time }, ...h].slice(0, 20));
      setTimeout(() => setCalStates((s) => { const n = {...s}; delete n[user._id]; return n; }), 4000);
    } catch {
      setCalStates((s) => ({ ...s, [user._id]: 'error' }));
      setHistory((h) => [{ ...user, status: 'error', time }, ...h].slice(0, 20));
      setTimeout(() => setCalStates((s) => { const n = {...s}; delete n[user._id]; return n; }), 4000);
    }
  };

  const toggleBulk = (id) => {
    setBulkIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const runBulk = async () => {
    const selected = results.filter((u) => bulkIds.has(u._id));
    for (const u of selected) await runCalibrate(u);
    setBulkIds(new Set());
  };

  return (
    <div className="fade-in">
      <Header
        title="Calibrate Users"
        subtitle="Force alignment recalculation for one or more users"
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-6">
        <Info size={15} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-brand-800">
          <p className="font-semibold">What does calibration do?</p>
          <p className="text-xs mt-0.5 text-brand-700">
            Enqueues a BullMQ alignment job for the selected user(s). The worker re-runs
            the full alignment formula for the most recent date and updates the
            <code className="mx-1 font-mono bg-brand-100 px-1 rounded">AlignmentMetric</code>
            document. Results appear in the app within seconds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — search + results */}
        <div className="lg:col-span-2 space-y-4">

          {/* Search bar */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Find User</h2>
            <form onSubmit={doSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-8"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={searching}>
                {searching ? <div className="spinner w-4 h-4" /> : <Search size={14} />}
                Search
              </button>
            </form>
            {searchErr && (
              <p className="text-xs text-slate-400 mt-2 ml-1">{searchErr}</p>
            )}
          </div>

          {/* Bulk actions */}
          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {results.length} result{results.length !== 1 ? 's' : ''} found
                {bulkIds.size > 0 && ` • ${bulkIds.size} selected`}
              </p>
              {bulkIds.size > 0 && (
                <button onClick={runBulk} className="btn-primary text-xs">
                  <Zap size={13} />
                  Calibrate {bulkIds.size} selected
                </button>
              )}
            </div>
          )}

          {/* Results table */}
          {results.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={bulkIds.size === results.length && results.length > 0}
                        onChange={() => {
                          bulkIds.size === results.length
                            ? setBulkIds(new Set())
                            : setBulkIds(new Set(results.map(u => u._id)));
                        }}
                        className="rounded border-slate-300"
                      />
                    </th>
                    {['Name', 'Email', 'Tier', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((u) => {
                    const cs = calStates[u._id];
                    return (
                      <tr key={u._id} className="table-row">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={bulkIds.has(u._id)}
                            onChange={() => toggleBulk(u._id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.subscriptionTier === 'premium' ? 'premium' : 'free'}>
                            {u.subscriptionTier ?? 'free'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => runCalibrate(u)}
                            disabled={!!cs}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              cs === 'done'    ? 'bg-green-100 text-green-700' :
                              cs === 'error'   ? 'bg-red-100 text-red-700'    :
                              cs === 'loading' ? 'bg-slate-100 text-slate-500 cursor-wait' :
                              'bg-brand-50 text-brand-700 hover:bg-brand-100'
                            }`}
                          >
                            {cs === 'done'    ? <><CheckCircle size={12}/> Queued</>    :
                             cs === 'error'   ? <><AlertCircle size={12}/> Failed</>   :
                             cs === 'loading' ? <><div className="spinner w-3 h-3"/> Wait…</> :
                             <><Crosshair size={12}/> Calibrate</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {results.length === 0 && !searching && (
            <div className="card p-12 flex flex-col items-center text-center">
              <Crosshair size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Search for a user above</p>
              <p className="text-slate-400 text-xs mt-1">Enter a name or email to find and calibrate users</p>
            </div>
          )}
        </div>

        {/* Right — history */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Session History</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="ml-auto text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0
              ? (
                <div className="text-center py-8">
                  <Clock size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No calibrations yet this session</p>
                </div>
              )
              : history.map((entry, i) => <HistoryEntry key={i} entry={entry} />)
            }
          </div>

          {/* Formula reference card */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-brand-500" />
              <h2 className="text-sm font-semibold text-slate-800">Alignment Formula</h2>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                { label: 'Core tasks',   pct: '× 0.50', max: '50 pts', color: 'text-brand-600'  },
                { label: 'Support',      pct: '× 0.20', max: '20 pts', color: 'text-purple-600' },
                { label: 'Habit',        pct: '× 0.15', max: '15 pts', color: 'text-green-600'  },
                { label: 'Effort (1–10)',pct: '× 0.10', max: '10 pts', color: 'text-yellow-600' },
                { label: 'Reflection',   pct: '× 0.05', max: ' 5 pts', color: 'text-cyan-600'   },
              ].map(({ label, pct, max, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className={`${color} font-medium`}>{label}</span>
                  <span className="text-slate-400">{pct}</span>
                  <span className="text-slate-500">{max}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 mt-1 flex justify-between text-slate-700 font-semibold">
                <span>Total</span>
                <span>100 pts</span>
              </div>
              <p className="text-slate-400 pt-1 leading-relaxed">
                Streak &gt;7d → ×1.10 &nbsp;|&nbsp; &gt;3d → ×1.05
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
