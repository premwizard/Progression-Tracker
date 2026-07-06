"use client";

import { motion } from 'framer-motion';
import { Plus, Activity, LayoutDashboard, ChevronRight } from 'lucide-react';
import { ProgressCard } from '../components/ui/ProgressCard';
import { ProgressRing } from '../components/ui/ProgressRing';

const MOCK_DATA = [
  {
    id: '1',
    title: 'React Advanced Patterns',
    category: 'Engineering',
    progress: 68,
    streak: 12,
  },
  {
    id: '2',
    title: 'System Design Interview',
    category: 'Career',
    progress: 34,
    streak: 3,
  },
  {
    id: '3',
    title: 'Marathon Training',
    category: 'Health',
    progress: 85,
    streak: 24,
  },
  {
    id: '4',
    title: 'French A2 Level',
    category: 'Language',
    progress: 15,
    streak: 0,
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl px-4 py-12 mx-auto space-y-12">
      {/* Header & Global Summary */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 text-primary mb-2">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-main md:text-5xl">
            Welcome back, Alex.
          </h1>
          <p className="mt-4 text-lg text-text-muted max-w-xl">
            You're currently tracking 4 active goals. You have a 24-day streak on Marathon Training. Keep the momentum going.
          </p>
        </div>

        {/* Global Progress Widget */}
        <div className="flex items-center p-6 space-x-6 glass rounded-2xl w-full md:w-auto">
          <ProgressRing progress={54} size={80} strokeWidth={8} />
          <div>
            <h3 className="text-lg font-semibold text-text-main">Overall Progress</h3>
            <p className="text-sm text-text-muted mt-1">Across all active items</p>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-text-main">Active Tracks</h2>
          <button className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>New Track</span>
          </button>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
        >
          {MOCK_DATA.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              <ProgressCard {...item} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-semibold text-text-main">Recent Activity</h2>
        <div className="p-1 glass rounded-2xl">
          <div className="divide-y divide-border-subtle">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center p-5 transition-colors hover:bg-bg-base/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mr-4">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-main">
                    Completed milestone <span className="text-primary font-semibold">"Understanding Hooks"</span>
                  </p>
                  <p className="text-xs text-text-muted mt-1">in React Advanced Patterns • 2 hours ago</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
