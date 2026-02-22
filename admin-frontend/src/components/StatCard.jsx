import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'brand', loading }) {
  const colors = {
    brand:  { bg: 'bg-brand-50',   icon: 'text-brand-600',  border: 'border-brand-100'  },
    green:  { bg: 'bg-green-50',   icon: 'text-green-600',  border: 'border-green-100'  },
    yellow: { bg: 'bg-yellow-50',  icon: 'text-yellow-600', border: 'border-yellow-100' },
    red:    { bg: 'bg-red-50',     icon: 'text-red-600',    border: 'border-red-100'    },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600', border: 'border-purple-100' },
    cyan:   { bg: 'bg-cyan-50',    icon: 'text-cyan-600',   border: 'border-cyan-100'   },
  };
  const c = colors[color] ?? colors.brand;

  return (
    <div className="card p-5 fade-in">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={c.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          {loading
            ? <div className="mt-1 h-7 w-20 bg-slate-100 rounded animate-pulse" />
            : <p className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
          }
          {sub && !loading && (
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}
