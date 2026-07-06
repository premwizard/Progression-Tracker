"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Save } from 'lucide-react';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; category: string; targetDate: string }) => void;
}

const CATEGORIES = ['Engineering', 'Health', 'Language', 'Career', 'Personal'];

export function CreateGoalModal({ isOpen, onClose, onSubmit }: CreateGoalModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onSubmit({ title, category, targetDate });
    setTitle('');
    setCategory(CATEGORIES[0]);
    setTargetDate('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden bg-bg-surface border border-border-subtle rounded-3xl shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-text-main">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Create New Goal</h3>
              </div>
              <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main hover:bg-border-subtle/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master React Native"
                  className="w-full px-4 py-3 text-sm bg-bg-base border border-border-subtle rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${category === c ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-base border-border-subtle text-text-muted hover:border-border-main'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Target Date <span className="text-text-muted font-normal">(Optional)</span></label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-bg-base border border-border-subtle rounded-xl text-text-main focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-sm font-medium border border-border-subtle text-text-main rounded-xl hover:bg-border-subtle/30 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                  <Save className="w-4 h-4" /> Save Goal
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
