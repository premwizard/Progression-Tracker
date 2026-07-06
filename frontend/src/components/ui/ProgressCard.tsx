"use client";

import { motion } from 'framer-motion';
import { Flame, Target } from 'lucide-react';
import Link from 'next/link';

interface ProgressCardProps {
  id: string;
  title: string;
  category: string;
  progress: number;
  streak: number;
  isCompleted?: boolean;
}

export function ProgressCard({
  id,
  title,
  category,
  progress,
  streak,
  isCompleted = false,
}: ProgressCardProps) {
  return (
    <Link href={`/item/${id}`} className="block outline-none group">
      <motion.div
        whileHover={{ y: -4 }}
        className="relative flex flex-col p-6 overflow-hidden transition-shadow duration-300 rounded-2xl glass hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30"
      >
        {/* Background Accent Gradient on Hover */}
        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-primary/5 to-transparent group-hover:opacity-100 pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-border-subtle/50 text-text-muted mb-2">
              {category}
            </span>
            <h3 className="text-xl font-semibold leading-tight text-text-main group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-base border border-border-subtle group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
            <Target className="w-5 h-5 text-text-muted group-hover:text-primary" />
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto pt-6">
          <div className="flex items-center space-x-4">
            {/* Streak Indicator */}
            {streak > 0 && (
              <div className="flex items-center space-x-1.5 text-sm font-medium text-accent">
                <Flame className="w-4 h-4" />
                <span>{streak} Days</span>
              </div>
            )}
            
            <div className="text-sm font-medium text-text-muted">
              {isCompleted ? 'Completed' : 'In Progress'}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Simple Progress Bar */}
            <div className="w-24 h-2 overflow-hidden rounded-full bg-border-subtle/50">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
            <span className="text-sm font-bold text-text-main">{progress}%</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

