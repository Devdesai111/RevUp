import React from 'react';
import {
  Layers, ExternalLink, Activity, Clock, AlertTriangle,
  CheckCircle, Zap, Moon, Sun, RotateCcw, FileText,
} from 'lucide-react';
import Header from '../components/Header';

const QUEUES = [
  {
    name:    'alignment',
    label:   'Alignment',
    icon:    Activity,
    color:   'brand',
    cron:    'On-demand (triggered on log submit)',
    desc:    'Recalculates daily alignment score for a user after they submit an execution log. Runs the full scoring formula: core × 0.50 + support × 0.20 + habit × 0.15 + effort × 0.10 + reflection × 0.05.',
    workers: 5,
    retries: 3,
    backoff: 'Exponential (2s base)',
    trigger: 'enqueueAlignment({ userId, date })',
  },
  {
    name:    'reflection',
    label:   'Reflection AI',
    icon:    FileText,
    color:   'purple',
    cron:    'On-demand (triggered on journal submit)',
    desc:    'Sends journal entry text to OpenAI and generates AI coaching feedback. Stores the result back on the JournalEntry document.',
    workers: 3,
    retries: 3,
    backoff: 'Exponential (2s base)',
    trigger: 'enqueueReflection({ journalEntryId, userId, date })',
  },
  {
    name:    'review',
    label:   'Weekly Review',
    icon:    RotateCcw,
    color:   'green',
    cron:    'Every Sunday at 23:00 (+ on-demand)',
    desc:    'Generates a weekly summary report for each user based on their 7 days of execution logs, alignment scores, and journal entries.',
    workers: 2,
    retries: 3,
    backoff: 'Exponential (2s base)',
    trigger: 'enqueueWeeklyReview({ userId, weekStart })',
  },
  {
    name:    'sweep',
    label:   'Midnight Sweep',
    icon:    Zap,
    color:   'yellow',
    cron:    'Every day at 00:05',
    desc:    'Cleans up stale Redis streak keys and marks incomplete execution logs. Runs lightly to avoid DB pressure at midnight.',
    workers: 1,
    retries: 3,
    backoff: 'Exponential (2s base)',
    trigger: 'Repeatable (automatic)',
  },
  {
    name:    'morning',
    label:   'Morning Brief',
    icon:    Sun,
    color:   'cyan',
    cron:    'Every 30 min (filters users at 07:00 local)',
    desc:    "Sends FCM push notifications to users whose local time is 7:00 AM. The worker filters by user timezone so it's a global delivery mechanism polling every 30 min.",
    workers: 1,
    retries: 3,
    backoff: 'Exponential (2s base)',
    trigger: 'Repeatable (automatic)',
  },
  {
    name:    'evening',
    label:   'Evening Prompt',
    icon:    Moon,
    color:   'purple',
    cron:    'Every 30 min (filters users at 21:00 local)',
    desc:    "Sends FCM push notifications to users whose local time is 9:00 PM. Prompts users to log today's execution before midnight.",
    workers: 1,
    retries: 3,
    backoff: 'Exponential (2s base)',
    trigger: 'Repeatable (automatic)',
  },
];

const COLOR_MAP = {
  brand:  { bg: 'bg-brand-50',  border: 'border-brand-100',  icon: 'text-brand-600',  badge: 'bg-brand-100 text-brand-700'   },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-100',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-700'   },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-100',   icon: 'text-cyan-600',   badge: 'bg-cyan-100 text-cyan-700'     },
};

function QueueCard({ q }) {
  const Icon = q.icon;
  const c    = COLOR_MAP[q.color] ?? COLOR_MAP.brand;

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={c.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{q.label}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{q.name}</p>
        </div>
        <span className={`badge ${c.badge}`}>Active</span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 leading-relaxed mb-4">{q.desc}</p>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-slate-400 mb-0.5">Schedule</p>
          <p className="font-medium text-slate-700">{q.cron}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-slate-400 mb-0.5">Concurrency</p>
          <p className="font-medium text-slate-700">{q.workers} worker{q.workers > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-slate-400 mb-0.5">Retries</p>
          <p className="font-medium text-slate-700">{q.retries} attempts</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-slate-400 mb-0.5">Backoff</p>
          <p className="font-medium text-slate-700">{q.backoff}</p>
        </div>
      </div>

      {/* Trigger */}
      <div className="bg-slate-900 rounded-lg px-3 py-2">
        <p className="text-slate-500 text-xs mb-0.5">Trigger</p>
        <code className="text-xs text-green-400 font-mono break-all">{q.trigger}</code>
      </div>
    </div>
  );
}

export default function Queues() {
  return (
    <div className="fade-in">
      <Header
        title="Queue Monitor"
        subtitle="All 6 BullMQ workers • Redis-backed • Auto-retry"
      />

      {/* Bull Board link */}
      <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-5 py-4 mb-6">
        <Layers size={18} className="text-brand-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-900">Bull Board — Live Queue UI</p>
          <p className="text-xs text-brand-600 mt-0.5">
            View real-time job counts (active / waiting / completed / failed) for all queues.
            Available in development mode only.
          </p>
        </div>
        <a
          href="http://localhost:3000/admin/queues"
          target="_blank"
          rel="noreferrer"
          className="btn-primary flex-shrink-0"
        >
          Open Bull Board
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Worker status indicators */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Worker Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUEUES.map((q) => {
            const Icon = q.icon;
            const c    = COLOR_MAP[q.color] ?? COLOR_MAP.brand;
            return (
              <div key={q.name} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
                <div className={`w-8 h-8 rounded-full ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <Icon size={14} className={c.icon} />
                </div>
                <p className="text-xs font-medium text-slate-700 text-center">{q.label}</p>
                <div className="flex items-center gap-1">
                  <span className="status-dot bg-green-500" />
                  <span className="text-xs text-slate-500">{q.workers}w</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-sm">
        <AlertTriangle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-yellow-800">
          <p className="font-medium">AI Cost Risk</p>
          <p className="text-xs mt-0.5 text-yellow-700">
            <code className="font-mono">checkAILimit</code> middleware exists in&nbsp;
            <code className="font-mono">src/middleware/</code> but is not wired to any route yet.
            Reflection and review queues can be triggered without per-user rate limiting.
          </p>
        </div>
      </div>

      {/* Queue cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {QUEUES.map((q) => <QueueCard key={q.name} q={q} />)}
      </div>

      {/* Redis connection info */}
      <div className="card p-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={15} className="text-green-500" />
          <h3 className="text-sm font-semibold text-slate-800">Redis Connection</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">App Redis (keyPrefix)</p>
            <code className="text-slate-700 font-mono">redis://localhost:6379</code>
            <p className="text-slate-400 mt-1">Prefix: <code>revup:</code></p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">BullMQ Redis (no prefix)</p>
            <code className="text-slate-700 font-mono">redis://localhost:6379</code>
            <p className="text-slate-400 mt-1">Separate connection — BullMQ requirement</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">Repeatable Jobs (4 total)</p>
            <p className="text-slate-700">Weekly Review • Midnight Sweep</p>
            <p className="text-slate-700">Morning Brief • Evening Prompt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
