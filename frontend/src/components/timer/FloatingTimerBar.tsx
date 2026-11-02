"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Check, Maximize2, Clock } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';

export const FloatingTimerBar: React.FC = () => {
  const {
    status,
    activeActivity,
    formattedDuration,
    isModalOpen,
    openTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
  } = useTimer();

  // Show only when timer is running/paused and the full modal is NOT open
  if (status === 'idle' || isModalOpen) {
    return null;
  }

  const accentColor = activeActivity?.color || '#F97316';

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Active focus session"
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] sm:w-auto"
      >
        <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-bg-surface/90 backdrop-blur-xl border border-border-subtle shadow-2xl shadow-black/30">
          {/* Activity Dot & Status */}
          <button
            onClick={() => openTimer(activeActivity?.id)}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="relative">
              <span
                className="block w-3 h-3 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              {status === 'running' && (
                <span
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-text-main group-hover:text-primary transition-colors line-clamp-1 max-w-[130px]">
                {activeActivity?.name || 'Focus Session'}
              </p>
              <p className="text-[10px] text-text-muted capitalize">
                {status === 'running' ? 'Active' : 'Paused'}
              </p>
            </div>
          </button>

          {/* Time Display */}
          <div
            onClick={() => openTimer(activeActivity?.id)}
            className="px-2.5 py-1 rounded-lg bg-bg-base border border-border-subtle cursor-pointer hover:border-primary/40 transition-colors"
          >
            <span className="font-mono text-sm font-bold tracking-tight text-text-main">
              {formattedDuration}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {status === 'running' ? (
              <button
                onClick={pauseTimer}
                title="Pause"
                className="p-1.5 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors"
                aria-label="Pause timer"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                title="Resume"
                className="p-1.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                aria-label="Resume timer"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={() => finishTimer()}
              title="Finish & Save"
              className="p-1.5 rounded-xl text-primary hover:bg-primary/10 transition-colors"
              aria-label="Finish session"
            >
              <Check className="w-4 h-4" />
            </button>

            <button
              onClick={() => openTimer(activeActivity?.id)}
              title="Expand Dial"
              className="p-1.5 rounded-xl text-text-muted hover:text-text-main hover:bg-border-subtle/50 transition-colors"
              aria-label="Expand timer modal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
