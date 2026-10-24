import React from 'react';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-white/5 dark:bg-white/5 light:bg-slate-200/60 rounded-xl ${className}`}
        />
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-white/10 rounded w-1/3" />
      <div className="h-8 w-8 bg-white/10 rounded-lg" />
    </div>
    <div className="h-8 bg-white/10 rounded w-1/2" />
    <div className="h-3 bg-white/5 rounded w-2/3" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 animate-pulse h-80 flex flex-col justify-between">
    <div className="h-5 bg-white/10 rounded w-1/4" />
    <div className="flex-1 my-4 flex items-end space-x-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-white/10 rounded-t"
          style={{ height: `${25 + ((i * 19) % 65)}%` }}
        />
      ))}
    </div>
    <div className="h-4 bg-white/5 rounded w-full" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card rounded-2xl border border-white/10 overflow-hidden animate-pulse">
    <div className="h-12 bg-white/10 border-b border-white/10 px-6 flex items-center space-x-6">
      <div className="h-4 bg-white/15 rounded w-24" />
      <div className="h-4 bg-white/15 rounded w-32" />
      <div className="h-4 bg-white/15 rounded w-20" />
      <div className="h-4 bg-white/15 rounded w-28" />
    </div>
    <div className="divide-y divide-white/5 p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-6 py-2">
          <div className="h-4 bg-white/5 rounded w-24" />
          <div className="h-4 bg-white/5 rounded w-36" />
          <div className="h-4 bg-white/5 rounded w-16" />
          <div className="h-4 bg-white/5 rounded w-24" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
