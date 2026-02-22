import React, { useState, useEffect } from 'react';
import {
  Users, Crown, TrendingUp, Activity, Database,
  Server, Wifi, Clock, CheckCircle, AlertCircle,
} from 'lucide-react';
import { getHealth, getAdminMetrics } from '../api/client';
import Header from '../components/Header';
import StatCard from '../components/StatCard';

function HealthRow({ label, status, detail }) {
  const ok = status === 'connected' || status === 'ok';
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`status-dot ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-slate-400">{detail}</span>}
        <span className={`badge ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {ok ? 'Healthy' : 'Error'}
        </span>
      </div>
    </div>
  );
}

function UptimeBar({ seconds }) {
  if (!seconds) return null;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean);
  return <span className="font-mono text-sm text-brand-600">{parts.join(' ')}</span>;
}

export default function Dashboard() {
  const [health,  setHealth]  = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loadH,   setLoadH]   = useState(true);
  const [loadM,   setLoadM]   = useState(true);
  const [errorH,  setErrorH]  = useState(null);

  const fetchAll = async () => {
    setLoadH(true); setLoadM(true);
    try {
      const r = await getHealth();
      setHealth(r.data.data);
    } catch (e) {
      setErrorH(e.response?.data?.message ?? 'Cannot reach server');
    } finally { setLoadH(false); }

    try {
      const r = await getAdminMetrics();
      setMetrics(r.data.data);
    } catch { /* might not be admin */ } finally { setLoadM(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return (
    <div className="fade-in">
      <Header
        title="Dashboard"
        subtitle={`Last updated: ${now}`}
        onRefresh={fetchAll}
        refreshing={loadH || loadM}
      />

      {/* Error banner */}
      {errorH && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 mb-6 text-sm">
          <AlertCircle size={16} />
          {errorH} — Is the backend running on port 3000?
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}     label="Total Users"      color="brand"
                  value={metrics?.totalActiveUsers} loading={loadM}
                  sub="Registered accounts" />
        <StatCard icon={Crown}     label="Premium Users"    color="purple"
                  value={metrics?.premiumUsers}     loading={loadM}
                  sub="Paid subscribers" />
        <StatCard icon={TrendingUp} label="Avg Alignment"   color="green"
                  value={metrics?.platformAverageScore
                    ? `${metrics.platformAverageScore.toFixed(1)}%` : null}
                  loading={loadM} sub="Platform-wide score" />
        <StatCard icon={Activity}  label="Total Metrics"    color="cyan"
                  value={metrics?.totalAlignmentMetrics} loading={loadM}
                  sub="Alignment records" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Server Health */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">System Health</h2>
          </div>
          {loadH ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : health ? (
            <>
              <HealthRow label="API Server"   status="ok"             detail={health.environment} />
              <HealthRow label="MongoDB"      status={health.database} />
              <HealthRow label="Redis"        status={health.redis}    />
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Uptime</span>
                </div>
                <UptimeBar seconds={health.uptime} />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Could not fetch health data.</p>
          )}
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">Quick Links</h2>
          </div>
          <div className="space-y-2">
            {[
              { href: 'http://localhost:3000/admin/queues',    label: 'Bull Board — Queue UI',   sub: 'Real-time BullMQ queue monitor'  },
              { href: 'http://localhost:3000/api/v1/docs',     label: 'Swagger API Docs',         sub: 'Interactive API documentation'   },
              { href: 'http://localhost:3000/api/v1/health',   label: 'Health Check (raw JSON)',  sub: 'GET /api/v1/health endpoint'     },
              { href: 'https://github.com/Devdesai111/RevUp',  label: 'GitHub Repository',        sub: 'Source code & commit history'    },
            ].map(({ href, label, sub }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-100
                           hover:border-brand-200 hover:bg-brand-50 transition-colors group"
              >
                <CheckCircle size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Known Gaps */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-slate-800">Known Gaps — Production Readiness</h2>
            <span className="badge bg-yellow-100 text-yellow-700 ml-auto">Tracked</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'AI cost limit middleware not wired to routes',  risk: 'High'   },
              { label: 'No data retention / TTL policy on DB models',   risk: 'Medium' },
              { label: 'Identity synthesis is synchronous (no timeout)',risk: 'Medium' },
              { label: 'Analytics dashboard not gated to premium',      risk: 'Low'    },
              { label: 'Plan weeklySprints array is unbounded',         risk: 'Low'    },
              { label: 'No voice playback — audio deleted immediately', risk: 'Low'    },
            ].map(({ label, risk }) => (
              <div key={label}
                   className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className={`badge mt-0.5 flex-shrink-0 ${
                  risk === 'High'   ? 'bg-red-100 text-red-700'    :
                  risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                     'bg-slate-200 text-slate-600'
                }`}>{risk}</span>
                <p className="text-sm text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
