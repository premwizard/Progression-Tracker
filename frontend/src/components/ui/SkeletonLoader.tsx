"use client";

import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-border-subtle/50 ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 glass rounded-2xl border border-border-subtle space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle/50">
        <Skeleton className="h-3 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-24 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-5 glass rounded-2xl border border-border-subtle">
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="p-5 glass rounded-2xl border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function SkeletonPage({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

