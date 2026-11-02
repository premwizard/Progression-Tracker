"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Check, Trash2, Clock, Calendar, FileText,
  ChevronDown, Flame, Sparkles, CheckCircle2, RotateCcw
} from 'lucide-react';
import { useTimer, ActivityOption } from '../../context/TimerContext';

export const TimerModal: React.FC = () => {
  const {
    status,
    activeActivity,
    availableActivities,
    liveElapsedSeconds,
    formattedDuration,
    targetProgressPercent,
    isModalOpen,
    notes,
    setNotes,
    closeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    discardTimer,
    logManualSession,
  } = useTimer();

  const [activeTab, setActiveTab] = useState<'live' | 'manual'>('live');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activeActivity?.id || availableActivities[0]?.id || ''
  );

  // Manual entry states
  const [manualDate, setManualDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [manualStartTime, setManualStartTime] = useState<string>('09:00');
  const [manualEndTime, setManualEndTime] = useState<string>('10:00');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);
  const [manualSuccess, setManualSuccess] = useState<boolean>(false);

  // Keep selected activity in sync
  React.useEffect(() => {
    if (activeActivity?.id) {
      setSelectedActivityId(activeActivity.id);
    } else if (!selectedActivityId && availableActivities.length > 0) {
      setSelectedActivityId(availableActivities[0].id);
    }
  }, [activeActivity, availableActivities, selectedActivityId]);

  if (!isModalOpen) return null;

  const currentAct = availableActivities.find(a => a.id === selectedActivityId) || activeActivity || availableActivities[0];
  const accentColor = currentAct?.color || '#F97316';

  // SVG Dial Math
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  // If no target, loop every 60 minutes
  const dialPercent = currentAct?.daily_target
    ? targetProgressPercent
    : ((liveElapsedSeconds % 3600) / 3600) * 100;
  const strokeDashoffset = circumference - (dialPercent / 100) * circumference;

  const handleStart = () => {
    startTimer(selectedActivityId, notes);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(false);

    if (!selectedActivityId) {
      setManualError('Please select an activity.');
      return;
    }
    if (!manualDate || !manualStartTime || !manualEndTime) {
      setManualError('Date, start time, and end time are required.');
      return;
    }

    const startIso = new Date(`${manualDate}T${manualStartTime}:00Z`).toISOString();
    const endIso = new Date(`${manualDate}T${manualEndTime}:00Z`).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      setManualError('End time must be after start time.');
      return;
    }

    setIsSubmittingManual(true);
    try {
      await logManualSession(selectedActivityId, startIso, endIso, manualNotes);
      setManualSuccess(true);
      setTimeout(() => {
        setManualSuccess(false);
        closeTimer();
      }, 1200);
    } catch (err: any) {
      setManualError(err.message || 'Failed to record manual session');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-lg overflow-hidden bg-bg-surface border border-border-subtle rounded-3xl shadow-2xl"
        >
          {/* Top Decorative Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />

          {/* Modal Header */}
          <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-main">Focus Timer Engine</h2>
                <p className="text-xs text-text-muted">High-precision wall-clock tracking</p>
              </div>
            </div>

            <button
              onClick={closeTimer}
              className="p-1.5 rounded-xl text-text-muted hover:text-text-main hover:bg-border-subtle/50 transition-colors"
              aria-label="Close timer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          {status === 'idle' && (
            <div className="flex border-b border-border-subtle px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 mr-6 ${
                  activeTab === 'live'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                Live Stopwatch
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'manual'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                Manual Entry
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Activity Picker */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Activity
              </label>
              <select
                disabled={status !== 'idle'}
                value={selectedActivityId}
                onChange={e => setSelectedActivityId(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-sm text-text-main focus:outline-none focus:border-primary transition-colors disabled:opacity-60 cursor-pointer"
              >
                {availableActivities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.name} {act.category ? `(${act.category})` : ''} {act.daily_target ? `• Target: ${act.daily_target}m` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* TAB: LIVE STOPWATCH */}
            {activeTab === 'live' && (
              <div className="space-y-6">
                {/* Radial Glow Dial */}
                <div className="relative flex flex-col items-center justify-center py-4">
                  <div className="relative w-60 h-60 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                      {/* Background circle */}
                      <circle
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-border-subtle/30"
                      />
                      {/* Animated Progress circle */}
                      <motion.circle
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </svg>

                    {/* Dial Center Info */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                      {/* Status indicator */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'running'
                              ? 'bg-emerald-400 animate-ping'
                              : status === 'paused'
                              ? 'bg-amber-400'
                              : 'bg-text-muted/40'
                          }`}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          {status === 'running' ? 'Focusing' : status === 'paused' ? 'Paused' : 'Ready'}
                        </span>
                      </div>

                      {/* Main Time Display */}
                      <h1 className="text-4xl font-extrabold tracking-tight font-mono text-text-main drop-shadow-sm">
                        {formattedDuration}
                      </h1>

                      {/* Target Info */}
                      {currentAct?.daily_target ? (
                        <p className="mt-1 text-xs text-text-muted font-medium">
                          {targetProgressPercent}% of {currentAct.daily_target}m goal
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-text-muted">Unbounded session</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Session Notes / Objective
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="What are you focusing on?"
                    className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {status === 'idle' ? (
                    <button
                      onClick={handleStart}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all text-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Start Focus Session
                    </button>
                  ) : (
                    <>
                      {status === 'running' ? (
                        <button
                          onClick={pauseTimer}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all text-sm"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={resumeTimer}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-sm"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => finishTimer()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-900/30 transition-all text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Finish & Save
                      </button>

                      <button
                        onClick={discardTimer}
                        title="Discard session"
                        className="p-3 rounded-2xl text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-border-subtle transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MANUAL ENTRY */}
            {activeTab === 'manual' && status === 'idle' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                {manualError && (
                  <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {manualError}
                  </div>
                )}
                {manualSuccess && (
                  <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Session logged successfully!
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs text-text-main focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={manualStartTime}
                      onChange={e => setManualStartTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs text-text-main focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={manualEndTime}
                      onChange={e => setManualEndTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs text-text-main focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    placeholder="What did you accomplish during this session?"
                    className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all text-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmittingManual ? 'Saving Session...' : 'Log Completed Session'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

