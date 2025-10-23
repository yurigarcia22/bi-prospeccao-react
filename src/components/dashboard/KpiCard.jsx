// src/components/dashboard/KpiCard.jsx
import React from 'react';
import { ShineBorder } from '../ui/ShineBorder.jsx';

function KpiCard({ title, value, color }) {
  const colorClasses = {
    success: '!text-emerald-500 dark:!text-emerald-400',
    danger: '!text-red-600 dark:!text-red-500',
  };
  const textColorClass = color ? colorClasses[color] : 'text-slate-800 dark:text-slate-100';

  return (
    <div className="relative text-center p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-center">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
      <p className={`mt-2 font-bold text-4xl ${textColorClass}`}>
        {value}
      </p>
      <ShineBorder />
    </div>
  );
}

export default React.memo(KpiCard);