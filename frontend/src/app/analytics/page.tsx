"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Flame, Target, ArrowUp, ArrowDown, Minus, Zap, Calendar } from 'lucide-react';
import { ProgressRing } from '../../components/ui/ProgressRing';

type Range = '7d' | '30d' | '90d';

const CHART_DATA: Record<Range, { day: string; tasks: number; minutes: number }[]> = {
  '7d': [
    { day: 'Mon', tasks: 4, minutes: 65 },
    { day: 'Tue', tasks: 6, minutes: 90 },
    { day: 'Wed', tasks: 3, minutes: 45 },
    { day: 'Thu', tasks: 7, minutes: 110 },
    { day: 'Fri', tasks: 5, minutes: 80 },
    { day: 'Sat', tasks: 8, minutes: 130 },
    { day: 'Sun', tasks: 2, minutes: 30 },
  ],
  '30d': [
    { day: 'W1',  tasks: 22, minutes: 390 },
    { day: 'W2',  tasks: 31, minutes: 520 },
    { day: 'W3',  tasks: 19, minutes: 310 },
    { day: 'W4',  tasks: 35, minutes: 550 },
  ],
  '90d': [
    { day: 'Jan', tasks: 68, minutes: 1100 },
    { day: 'Feb', tasks: 82, minutes: 1350 },
    { day: 'Mar', tasks: 95, minutes: 1580 },
  ],
};

const KPI_DATA: Record<Range, { tasks: number; minutes: number; taskTrend: string; minTrend: string }> = {
  '7d':  { tasks: 35,  minutes: 550,  taskTrend: '+3 vs last week',  minTrend: '+22m vs last week' },
  '30d': { tasks: 107, minutes: 1770, taskTrend: '+12 vs last month', minTrend: '+1.5h vs last month' },
  '90d': { tasks: 245, minutes: 4030, taskTrend: '+38 vs last period', minTrend: '+4h vs last period' },
};

const GOALS_PROGRESS = [
  { title: 'React Advanced Patterns', progress: 68, trend: +5, category: 'Engineering', color: 'bg-blue-500' },
  { title: 'System Design Interview', progress: 34, trend: +8, category: 'Career', color: 'bg-purple-500' },
  { title: 'Marathon Training', progress: 85, trend: +3, category: 'Health', color: 'bg-emerald-500' },
  { title: 'French A2 Level', progress: 15, trend: -2, category: 'Language', color: 'bg-orange-500' },
];

const STREAK_HEATMAP = Array.from({ length: 52 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => {
    const rand = Math.random();
    if (week > 48) return rand > 0.3 ? Math.ceil(rand * 4) : 0;
    if (week > 40) return rand > 0.4 ? Math.ceil(rand * 3) : 0;
    return rand > 0.55 ? Math.ceil(rand * 2) : 0;
  })
);

const HEAT_COLORS = [
  'bg-border-subtle/30',
  'bg-primary/20',
  'bg-primary/40',
  'bg-primary/70',
  'bg-primary',
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const maxTasks = 0;
const maxMinutes = 0;

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-500">
      <ArrowUp className="w-3 h-3" />+{value}%
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
      <ArrowDown className="w-3 h-3" />{value}%
    </span>
  );
  return <span className="flex items-center gap-0.5 text-xs font-medium text-text-muted"><Minus className="w-3 h-3" />0%</span>;
}

export default function AnalyticsPage() {
  const [barMode, setBarMode] = useState<'tasks' | 'minutes'>('tasks');
  const [range, setRange] = useState<Range>('7d');

  const chartData = CHART_DATA[range];
  const kpi = KPI_DATA[range];
  const computedMaxTasks   = Math.max(...chartData.map(d => d.tasks));
  const computedMaxMinutes = Math.max(...chartData.map(d => d.minutes));
  const avgProgress = Math.round(GOALS_PROGRESS.reduce((a, g) => a + g.progress, 0) / GOALS_PROGRESS.length);

  return (
    <div className="max-w-5xl px-4 py-12 mx-auto space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-2 text-primary mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">Analytics</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-main">Progress Insights</h1>
            <p className="mt-2 text-text-muted">Tracking your consistency and growth over time</p>
          </div>
          {/* Time-range selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-bg-base border border-border-subtle">
            {(['7d', '30d', '90d'] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  range === r ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Calendar className="w-3 h-3" />{r}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: <Target className="w-5 h-5" />,    label: 'Tasks completed', value: kpi.tasks,           sub: kpi.taskTrend, positive: true },
          { icon: <Zap className="w-5 h-5" />,        label: 'Focus minutes',   value: `${kpi.minutes}m`,   sub: kpi.minTrend,  positive: true },
          { icon: <Flame className="w-5 h-5" />,      label: 'Best streak',     value: '24 days',            sub: 'Marathon Training', positive: true },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Avg progress',    value: `${avgProgress}%`,    sub: '+5% overall',  positive: true },
        ].map(stat => (
          <motion.div key={stat.label} variants={itemVariants}
            className="p-5 glass rounded-2xl border border-border-subtle hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">{stat.icon}</div>
              <span className={`text-xs font-medium ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>{stat.sub}</span>
            </div>
            <p className="text-2xl font-bold text-text-main">{stat.value}</p>
            <p className="mt-0.5 text-xs text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Weekly activity chart */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="p-6 glass rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-main">Weekly Activity</h2>
            <p className="text-sm text-text-muted">Tasks completed & focus time</p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-bg-base border border-border-subtle">
            {(['tasks', 'minutes'] as const).map(m => (
              <button
                key={m}
                onClick={() => setBarMode(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${barMode === m ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                {m === 'tasks' ? 'Tasks' : 'Minutes'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2 h-40">
          {chartData.map((d, i) => {
            const value = barMode === 'tasks' ? d.tasks : d.minutes;
            const max = barMode === 'tasks' ? computedMaxTasks : computedMaxMinutes;
            const heightPct = max > 0 ? (value / max) * 100 : 0;
            const isLast = i === chartData.length - 1;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs font-medium text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">{value}</span>
                <div className="w-full flex items-end" style={{ height: '120px' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                    className={`w-full rounded-t-lg transition-colors ${isLast ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/60'}`}
                  />
                </div>
                <span className={`text-xs ${isLast ? 'font-semibold text-primary' : 'text-text-muted'}`}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Goals breakdown */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="p-6 glass rounded-2xl border border-border-subtle">
        <h2 className="text-lg font-semibold text-text-main mb-1">Goals Breakdown</h2>
        <p className="text-sm text-text-muted mb-6">Progress this week vs. last week</p>
        <div className="space-y-5">
          {GOALS_PROGRESS.map((g, i) => (
            <div key={g.title}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${g.color}`} />
                  <span className="text-sm font-medium text-text-main">{g.title}</span>
                  <span className="text-xs text-text-muted hidden sm:inline">{g.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendBadge value={g.trend} />
                  <span className="text-sm font-bold text-text-main">{g.progress}%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-border-subtle/50">
                <motion.div
                  className={`h-full rounded-full ${g.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${g.progress}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Activity heatmap */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="p-6 glass rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-main">Activity Heatmap</h2>
            <p className="text-sm text-text-muted">Your consistency over the last 12 months</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Less</span>
            {HEAT_COLORS.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {STREAK_HEATMAP.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((intensity, di) => (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm cursor-default transition-opacity hover:opacity-70 ${HEAT_COLORS[intensity]}`}
                  title={`${intensity > 0 ? `${intensity} activity level` : 'No activity'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs text-text-muted">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
          <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
          <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
        </div>
      </motion.div>

      {/* Overall ring summary */}
      <motion.div variants={itemVariants} initial="hidden" animate="show"
        className="flex flex-wrap items-center justify-around gap-6 p-6 glass rounded-2xl border border-border-subtle"
      >
        {GOALS_PROGRESS.map(g => (
          <div key={g.title} className="flex flex-col items-center gap-2">
            <ProgressRing progress={g.progress} size={72} strokeWidth={7} />
            <p className="text-xs text-center text-text-muted max-w-[80px] leading-tight">{g.title}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

