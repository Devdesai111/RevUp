import React from 'react';

const VARIANTS = {
  premium: 'bg-purple-100 text-purple-700',
  free:    'bg-slate-100 text-slate-600',
  admin:   'bg-brand-100 text-brand-700',
  active:  'bg-green-100 text-green-700',
  error:   'bg-red-100 text-red-700',
  warn:    'bg-yellow-100 text-yellow-700',
  default: 'bg-slate-100 text-slate-600',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={`badge ${VARIANTS[variant] ?? VARIANTS.default}`}>
      {children}
    </span>
  );
}
