"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Flame, Circle, CheckCircle2, Clock, Filter, Search, ChevronDown, X, Trash2 } from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  category: string;
  streak: number;
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Complete React hooks deep dive', description: 'Study useReducer, useContext, and custom hooks patterns', priority: 'high', status: 'in_progress', dueDate: 'Today', category: 'Engineering', streak: 5 },
  { id: '2', title: 'System design: URL shortener', description: 'Design scalable URL shortener with 100M requests/day', priority: 'high', status: 'todo', dueDate: 'Tomorrow', category: 'Career', streak: 0 },
  { id: '3', title: '10km morning run', description: 'Maintain marathon training pace at 5:30/km', priority: 'medium', status: 'done', dueDate: 'Today', category: 'Health', streak: 24 },
  { id: '4', title: 'French vocabulary — 20 new words', description: 'Focus on A2 travel and food vocabulary', priority: 'medium', status: 'todo', dueDate: 'Today', category: 'Language', streak: 3 },
  { id: '5', title: 'Read: Designing Data-Intensive Apps — Ch.5', description: 'Focus on replication and distributed systems', priority: 'low', status: 'todo', dueDate: 'This week', category: 'Engineering', streak: 0 },
  { id: '6', title: 'Meditation — 15 minutes', description: 'Mindfulness practice with Headspace', priority: 'low', status: 'done', dueDate: 'Today', category: 'Health', streak: 12 },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: 'text-red-500',    bg: 'bg-red-500/10' },
  medium: { label: 'Medium', color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  low:    { label: 'Low',    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const STATUS_CONFIG: Record<Status, { label: string }> = {
  todo:        { label: 'To Do' },
  in_progress: { label: 'In Progress' },
  done:        { label: 'Done' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = tasks.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
    ));
  };

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="max-w-4xl px-4 py-12 mx-auto space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-2 text-primary mb-2">
          <CheckSquare className="w-5 h-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">Tasks</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-main">My Tasks</h1>
            <p className="mt-2 text-text-muted">{counts.done} of {counts.all} completed today</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="grid grid-cols-3 gap-4">
        {[
          { label: 'To Do',       value: counts.todo,        color: 'text-text-muted' },
          { label: 'In Progress', value: counts.in_progress, color: 'text-primary' },
          { label: 'Completed',   value: counts.done,        color: 'text-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className="p-4 text-center glass rounded-2xl border border-border-subtle">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-text-muted">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters + Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-bg-surface border border-border-subtle text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${filter === f ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'text-text-muted border-border-subtle hover:border-primary/30 hover:text-text-main'}`}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f as Status].label}
              <span className={`ml-1.5 ${filter === f ? 'text-white/70' : 'text-text-muted'}`}>({counts[f]})</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Task list */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(task => {
            const priority = PRIORITY_CONFIG[task.priority];
            const isDone = task.status === 'done';
            return (
              <motion.div
                key={task.id}
                variants={itemVariants}
                exit={{ opacity: 0, y: -8 }}
                layout
                className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 ${isDone ? 'bg-bg-surface/50 border-border-subtle/50 opacity-70' : 'glass border-border-subtle'}`}
              >
                {/* Checkbox */}
                <button onClick={() => toggleStatus(task.id)} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Circle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                  }
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${isDone ? 'line-through text-text-muted' : 'text-text-main'}`}>{task.title}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${priority.bg} ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-border-subtle/50 text-text-muted">{task.category}</span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />{task.dueDate}
                    </span>
                    {task.streak > 0 && (
                      <span className="flex items-center gap-1 text-xs text-accent font-medium">
                        <Flame className="w-3 h-3" />{task.streak}d streak
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-text-muted">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
