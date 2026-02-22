import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Crosshair, AlertCircle, CheckCircle } from 'lucide-react';
import { getAdminUsers, calibrateUser } from '../api/client';
import Header from '../components/Header';
import Badge from '../components/Badge';

const TIERS = ['all', 'free', 'premium'];
const LIMIT = 15;

function Skeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: 6 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [tier,    setTier]    = useState('all');
  const [search,  setSearch]  = useState('');
  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [calState, setCalState] = useState({}); // { userId: 'loading'|'done'|'error' }

  const totalPages = Math.ceil(total / LIMIT);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (tier !== 'all') params.tier = tier;
      if (query)          params.search = query;
      const res = await getAdminUsers(params);
      const d   = res.data;
      setUsers(d.data ?? []);
      setTotal(d.pagination?.total ?? 0);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, tier, query]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  };

  const handleCalibrate = async (userId) => {
    setCalState((s) => ({ ...s, [userId]: 'loading' }));
    try {
      await calibrateUser(userId);
      setCalState((s) => ({ ...s, [userId]: 'done' }));
      setTimeout(() => setCalState((s) => { const n = { ...s }; delete n[userId]; return n; }), 3000);
    } catch {
      setCalState((s) => ({ ...s, [userId]: 'error' }));
      setTimeout(() => setCalState((s) => { const n = { ...s }; delete n[userId]; return n; }), 3000);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="fade-in">
      <Header
        title="Users"
        subtitle={`${total} total users`}
        onRefresh={fetchUsers}
        refreshing={loading}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-8 w-56"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {query && (
            <button type="button" className="btn-secondary"
              onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>

        {/* Tier filter */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => { setTier(t); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tier === t
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Name', 'Email', 'Tier', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <Skeleton /> : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No users found{query ? ` for "${query}"` : ''}.
                  </td>
                </tr>
              ) : users.map((u) => {
                const cs = calState[u._id];
                return (
                  <tr key={u._id} className="table-row">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.subscriptionTier === 'premium' ? 'premium' : 'free'}>
                        {u.subscriptionTier ?? 'free'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'admin' : 'default'}>
                        {u.role ?? 'user'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCalibrate(u._id)}
                        disabled={!!cs}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          cs === 'done'    ? 'bg-green-100 text-green-700' :
                          cs === 'error'   ? 'bg-red-100 text-red-700'    :
                          cs === 'loading' ? 'bg-slate-100 text-slate-500 cursor-wait' :
                          'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        }`}
                      >
                        {cs === 'done'    ? <><CheckCircle size={12}/> Done</>        :
                         cs === 'error'   ? <><AlertCircle size={12}/> Failed</>     :
                         cs === 'loading' ? <><div className="spinner w-3 h-3"/> Queuing…</> :
                         <><Crosshair size={12}/> Calibrate</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} &nbsp;·&nbsp; {total} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = i + Math.max(1, page - 3);
                if (pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      pg === page ? 'bg-brand-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
