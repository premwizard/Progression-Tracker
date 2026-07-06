"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Activity, LayoutDashboard, ChevronRight, Target, CheckSquare,
  BrainCircuit, Flame, TrendingUp, ArrowRight, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { ProgressCard } from '../../components/ui/ProgressCard';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { SkeletonCard, SkeletonStat } from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';

const MOCK_DATA = [
  { id: '1', title: 'React Advanced Patterns', category: 'Engineering', progress: 68, streak: 12 },
  { id: '2', title: 'System Design Interview',  category: 'Career',      progress: 34, streak: 3 },
  { id: '3', title: 'Marathon Training',         category: 'Health',      progress: 85, streak: 24 },
  { id: '4', title: 'French A2 Level',           category: 'Language',    progress: 15, streak: 0 },
];

const RECENT_ACTIVITY = [
  { id: '1', action: 'Completed milestone', target: '"Understanding Hooks"', context: 'React Advanced Patterns', time: '2h ago', icon: CheckSquare },
  { id: '2', action: 'Ran',                 target: '10km',                   context: 'Marathon Training',     time: '5h ago', icon: Activity },
  { id: '3', action: 'Started milestone',   target: '"System Design Basics"', context: 'Career',               time: '1d ago', icon: Target },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const overallProgress = Math.round(MOCK_DATA.reduce((a, g) => a + g.progress, 0) / MOCK_DATA.length);
  const bestStreak = Math.max(...MOCK_DATA.map(g => g.streak));
  const activeTracks = MOCK_DATA.length;

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="max-w-6xl px-4 py-12 mx-auto space-y-12">

      {/* ── Hero Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-2 text-primary mb-3">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">Dashboard</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-main">
              {getGreeting()}, {firstName}.
            </h1>
            <p className="mt-2 text-text-muted max-w-xl">
              You're tracking <span className="font-semibold text-text-main">{activeTracks} active goals</span> with a
              best streak of <span className="font-semibold text-accent">{bestStreak} days 🔥</span>. Keep the momentum.
            </p>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Link href="/goals"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Goal
            </Link>
            <Link href="/assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border-subtle text-text-muted hover:border-primary/30 hover:text-primary transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Stats ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
          : [
              { icon: <TrendingUp className="w-5 h-5" />, label: 'Overall Progress', value: `${overallProgress}%`, sub: '+5% this week', color: 'text-primary' },
              { icon: <Flame className="w-5 h-5" />,       label: 'Best Streak',      value: `${bestStreak}d`,    sub: 'Marathon Training', color: 'text-accent' },
              { icon: <Target className="w-5 h-5" />,       label: 'Active Goals',     value: activeTracks,        sub: '1 near completion', color: 'text-blue-500' },
              { icon: <CheckSquare className="w-5 h-5" />, label: 'Tasks Today',       value: '7',                 sub: '3 completed',       color: 'text-emerald-500' },
            ].map(stat => (
              <motion.div key={stat.label} variants={fadeUp}
                className="p-5 glass rounded-2xl border border-border-subtle hover:border-primary/30 transition-colors"
              >
                <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
                <p className="text-2xl font-bold text-text-main">{stat.value}</p>
                <p className="mt-0.5 text-xs font-medium text-text-muted">{stat.label}</p>
                <p className="text-[10px] text-text-muted opacity-70 mt-1">{stat.sub}</p>
              </motion.div>
            ))
        }
      </motion.div>

      {/* ── Overall Progress Ring ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
        className="flex flex-col sm:flex-row items-center gap-8 p-8 glass rounded-2xl border border-border-subtle"
      >
        <ProgressRing progress={overallProgress} size={96} strokeWidth={9} />
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl font-semibold text-text-main">Overall Completion</h2>
          <p className="text-text-muted mt-1">Across all active goals · Updated live</p>
        </div>
        <Link href="/analytics"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-all"
        >
          View Analytics <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* ── Active Tracks ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main">Active Tracks</h2>
          <Link href="/goals" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-2"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : MOCK_DATA.map(item => (
                <motion.div key={item.id} variants={fadeUp}>
                  <ProgressCard
                    id={item.id}
                    title={item.title}
                    category={item.category}
                    progress={item.progress}
                    streak={item.streak}
                  />
                </motion.div>
              ))
          }
        </motion.div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main">Recent Activity</h2>
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="glass rounded-2xl border border-border-subtle overflow-hidden"
        >
          {isLoading ? (
            <div className="divide-y divide-border-subtle/50">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-border-subtle/50 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-border-subtle/50 rounded-full animate-pulse" />
                    <div className="h-2.5 w-1/2 bg-border-subtle/30 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            RECENT_ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.id} variants={fadeUp}
                  className={`flex items-center gap-4 p-5 hover:bg-border-subtle/20 transition-colors ${i < RECENT_ACTIVITY.length - 1 ? 'border-b border-border-subtle/50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-main">
                      {item.action}{' '}
                      <span className="font-semibold text-primary">{item.target}</span>
                      {' '}in{' '}
                      <span className="font-medium">{item.context}</span>
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{item.time}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* ── AI Coach nudge ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
        className="flex flex-col sm:flex-row items-center gap-5 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-bg-surface to-accent/5 border border-primary/20"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold text-text-main">Your AI Coach has insights for you</h3>
          <p className="text-sm text-text-muted mt-0.5">Based on your patterns this week, there are 3 recommendations waiting.</p>
        </div>
        <Link href="/assistant"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex-shrink-0"
        >
          Chat now <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
