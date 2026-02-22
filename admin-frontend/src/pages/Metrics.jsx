import React from 'react';
import {
  BarChart3, Users, Crown, TrendingUp, Activity,
  AlertCircle,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { getAdminMetrics } from '../api/client';
import { useApi } from '../hooks/useApi';
import Header from '../components/Header';
import StatCard from '../components/StatCard';

/* ── Custom tooltip ─────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Gauge for avg alignment score ─────────────────────────────────────────── */
function AlignmentGauge({ score }) {
  const val = score ?? 0;
  const color = val >= 75 ? '#22c55e' : val >= 45 ? '#6366f1' : '#ef4444';
  const label = val >= 75 ? 'Aligned' : val >= 45 ? 'Stable' : 'Diminished';

  const data = [
    { name: 'score', value: val,       fill: color    },
    { name: 'empty', value: 100 - val, fill: '#f1f5f9' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={225} endAngle={-45}
            data={data}
            barSize={14}
          >
            <RadialBar dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{val.toFixed(1)}</span>
          <span className="text-xs text-slate-400">out of 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold mt-1" style={{ color }}>{label}</span>
      <span className="text-xs text-slate-400">Platform Average</span>
    </div>
  );
}

export default function Metrics() {
  const { data, loading, error, refetch } = useApi(getAdminMetrics);

  const freeUsers    = (data?.totalActiveUsers ?? 0) - (data?.premiumUsers ?? 0);
  const premiumUsers = data?.premiumUsers ?? 0;

  const tierData = [
    { name: 'Free',    value: freeUsers,    fill: '#e2e8f0' },
    { name: 'Premium', value: premiumUsers, fill: '#818cf8' },
  ];

  const barData = [
    { label: 'Total Users',    value: data?.totalActiveUsers       ?? 0 },
    { label: 'Premium',        value: data?.premiumUsers           ?? 0 },
    { label: 'Free',           value: freeUsers                        },
    { label: 'Metrics Logged', value: data?.totalAlignmentMetrics  ?? 0 },
  ];

  return (
    <div className="fade-in">
      <Header
        title="Platform Metrics"
        subtitle="Aggregated stats across all users"
        onRefresh={refetch}
        refreshing={loading}
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                        rounded-xl px-4 py-3 mb-6 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}     label="Total Users"     color="brand"
                  value={data?.totalActiveUsers}      loading={loading} />
        <StatCard icon={Crown}     label="Premium Users"   color="purple"
                  value={data?.premiumUsers}          loading={loading}
                  sub={data ? `${((premiumUsers / (data.totalActiveUsers || 1)) * 100).toFixed(1)}% of total` : ''} />
        <StatCard icon={TrendingUp} label="Avg Alignment"  color="green"
                  value={data?.platformAverageScore
                    ? `${data.platformAverageScore.toFixed(1)}%` : null}
                  loading={loading} />
        <StatCard icon={Activity}  label="Total Metrics"   color="cyan"
                  value={data?.totalAlignmentMetrics} loading={loading}
                  sub="Alignment records stored" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Alignment gauge */}
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-5 self-start">
            <TrendingUp size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">Alignment Score</h2>
          </div>
          {loading
            ? <div className="w-44 h-44 rounded-full bg-slate-100 animate-pulse" />
            : <AlignmentGauge score={data?.platformAverageScore} />
          }
          <div className="mt-5 w-full space-y-2 text-xs">
            {[
              { label: 'Aligned',    range: '> 75',  color: 'bg-green-500' },
              { label: 'Stable',     range: '45–75', color: 'bg-brand-500' },
              { label: 'Diminished', range: '< 45',  color: 'bg-red-500'   },
            ].map(({ label, range, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-slate-600">{label}</span>
                </div>
                <span className="text-slate-400 font-mono">{range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">Key Counts</h2>
          </div>
          {loading
            ? <div className="h-48 bg-slate-100 rounded animate-pulse" />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={['#6366f1','#a855f7','#e2e8f0','#06b6d4'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Pie — tier breakdown */}
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center gap-2 mb-5">
            <Crown size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">Subscription Tier Breakdown</h2>
          </div>
          {loading
            ? <div className="h-52 bg-slate-100 rounded animate-pulse" />
            : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={tierData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={4} dataKey="value"
                    >
                      {tierData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex-1 space-y-4">
                  {tierData.map(({ name, value, fill }) => (
                    <div key={name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm" style={{ background: fill }} />
                          <span className="font-medium text-slate-700">{name}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{value}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${((value / (data?.totalActiveUsers || 1)) * 100).toFixed(1)}%`,
                            background: fill,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {((value / (data?.totalActiveUsers || 1)) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
