"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Flame, ChevronRight, TrendingUp, CheckCircle2, Circle, Zap, BookOpen, Heart, Globe } from 'lucide-react';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { CreateGoalModal } from '../../components/ui/CreateGoalModal';

type GoalCategory = 'Engineering' | 'Career' | 'Health' | 'Language' | 'Finance' | 'Personal';

interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  progress: number;
  streak: number;
  dueDate: string;
  milestones: Milestone[];
  totalTasks: number;
  completedTasks: number;
}

const CATEGORY_ICONS: Record<GoalCategory, React.ReactNode> = {
  Engineering: <Zap className="w-4 h-4" />,
  Career:      <TrendingUp className="w-4 h-4" />,
  Health:      <Heart className="w-4 h-4" />,
  Language:    <Globe className="w-4 h-4" />,
  Finance:     <TrendingUp className="w-4 h-4" />,
  Personal:    <BookOpen className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  Engineering: 'bg-blue-500/10 text-blue-500',
  Career:      'bg-purple-500/10 text-purple-500',
  Health:      'bg-emerald-500/10 text-emerald-500',
  Language:    'bg-orange-500/10 text-orange-500',
  Finance:     'bg-yellow-500/10 text-yellow-500',
  Personal:    'bg-pink-500/10 text-pink-500',
};

const MOCK_GOALS: Goal[] = [
  {
    id: '1', title: 'React Advanced Patterns', description: 'Master render props, compound components, and concurrent patterns', category: 'Engineering',
    progress: 68, streak: 12, dueDate: 'Aug 2026', totalTasks: 24, completedTasks: 16,
    milestones: [
      { id: 'm1', title: 'Complete hooks deep-dive', done: true },
      { id: 'm2', title: 'Build custom hooks library', done: true },
      { id: 'm3', title: 'Understand Concurrent Mode', done: false },
      { id: 'm4', title: 'Final project: Component library', done: false },
    ],
  },
  {
    id: '2', title: 'System Design Interview', description: 'Crack FAANG-level system design rounds', category: 'Career',
    progress: 34, streak: 3, dueDate: 'Sep 2026', totalTasks: 18, completedTasks: 6,
    milestones: [
      { id: 'm1', title: 'Core distributed systems', done: true },
      { id: 'm2', title: 'Database design patterns', done: false },
      { id: 'm3', title: 'Mock interviews ×5', done: false },
    ],
  },
  {
    id: '3', title: 'Marathon Training', description: 'Complete my first full marathon in under 4 hours', category: 'Health',
    progress: 85, streak: 24, dueDate: 'Oct 2026', totalTasks: 30, completedTasks: 25,
    milestones: [
      { id: 'm1', title: 'Run 5km without stopping', done: true },
      { id: 'm2', title: 'Half marathon completed', done: true },
      { id: 'm3', title: '30km long run', done: true },
      { id: 'm4', title: 'Final marathon race', done: false },
    ],
  },
  {
    id: '4', title: 'French A2 Level', description: 'Reach conversational A2 proficiency in French', category: 'Language',
    progress: 15, streak: 0, dueDate: 'Dec 2026', totalTasks: 40, completedTasks: 6,
    milestones: [
      { id: 'm1', title: 'Alphabet & pronunciation', done: true },
      { id: 'm2', title: 'Basic conversations', done: false },
      { id: 'm3', title: 'A1 level test pass', done: false },
      { id: 'm4', title: 'A2 level certification', done: false },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function GoalsPage() {
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const overallProgress = Math.round(MOCK_GOALS.reduce((acc, g) => acc + g.progress, 0) / MOCK_GOALS.length);

  return (
    <div className="max-w-4xl px-4 py-12 mx-auto space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-2 text-primary mb-2">
          <Target className="w-5 h-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">Goals</span>
        </div>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-main">Your Goals</h1>
            <p className="mt-2 text-text-muted">{MOCK_GOALS.length} active goals · Keep the streak alive</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </motion.div>

      {/* Overall summary widget */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="flex flex-col sm:flex-row items-center gap-8 p-8 glass rounded-2xl border border-border-subtle"
      >
        <ProgressRing progress={overallProgress} size={100} strokeWidth={9} />
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-semibold text-text-main">Overall Completion</h2>
          <p className="mt-1 text-text-muted">Across {MOCK_GOALS.length} active goals</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
            {[
              { label: 'Completed tasks', value: MOCK_GOALS.reduce((a, g) => a + g.completedTasks, 0) },
              { label: 'Remaining',       value: MOCK_GOALS.reduce((a, g) => a + (g.totalTasks - g.completedTasks), 0) },
              { label: 'Best streak',     value: `${Math.max(...MOCK_GOALS.map(g => g.streak))}d 🔥` },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-text-main">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Goal cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        {MOCK_GOALS.map(goal => {
          const isOpen = expandedId === goal.id;
          const categoryColor = CATEGORY_COLORS[goal.category];
          return (
            <motion.div key={goal.id} variants={itemVariants}
              className="overflow-hidden glass rounded-2xl border border-border-subtle hover:border-primary/30 transition-colors"
            >
              {/* Card header */}
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(isOpen ? null : goal.id)}
              >
                <div className="flex items-center gap-4 p-6">
                  <div className="flex-shrink-0">
                    <ProgressRing progress={goal.progress} size={56} strokeWidth={6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
                        {CATEGORY_ICONS[goal.category]}
                        {goal.category}
                      </span>
                      {goal.streak > 0 && (
                        <span className="flex items-center gap-1 text-xs font-medium text-accent">
                          <Flame className="w-3 h-3" />{goal.streak}d
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-text-main truncate">{goal.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{goal.description}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-text-muted">Due {goal.dueDate}</p>
                      <p className="text-xs text-text-muted">{goal.completedTasks}/{goal.totalTasks} tasks</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </button>

              {/* Expanded milestones */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-border-subtle pt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Milestones</p>
                      {goal.milestones.map(ms => (
                        <div key={ms.id} className="flex items-center gap-3">
                          {ms.done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            : <Circle className="w-4 h-4 text-text-muted flex-shrink-0" />
                          }
                          <span className={`text-sm ${ms.done ? 'line-through text-text-muted' : 'text-text-main'}`}>{ms.title}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
      <CreateGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={data => { console.log('Create goal', data); }} />
    </div>
  );
}

