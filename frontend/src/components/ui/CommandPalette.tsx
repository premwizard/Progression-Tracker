"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Target, CheckSquare, BrainCircuit,
  Activity, Settings, LogOut, ArrowRight, Zap, Plus, Hash
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const navigate = useCallback((path: string) => {
    router.push(path);
    onClose();
  }, [router, onClose]);

  const COMMANDS: Command[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, action: () => navigate('/dashboard'), category: 'Navigation', keywords: ['home', 'overview'] },
    { id: 'goals', label: 'Go to Goals', icon: <Target className="w-4 h-4" />, action: () => navigate('/goals'), category: 'Navigation', keywords: ['objectives', 'targets'] },
    { id: 'tasks', label: 'Go to Tasks', icon: <CheckSquare className="w-4 h-4" />, action: () => navigate('/tasks'), category: 'Navigation', keywords: ['todos', 'checklist'] },
    { id: 'assistant', label: 'Open AI Planner', icon: <BrainCircuit className="w-4 h-4" />, action: () => navigate('/assistant'), category: 'Navigation', keywords: ['ai', 'chat', 'coach'] },
    { id: 'analytics', label: 'Go to Analytics', icon: <Activity className="w-4 h-4" />, action: () => navigate('/analytics'), category: 'Navigation', keywords: ['charts', 'stats', 'insights'] },
    { id: 'new-goal', label: 'Create New Goal', icon: <Plus className="w-4 h-4" />, action: () => navigate('/goals'), category: 'Actions', keywords: ['add', 'create', 'new'] },
    { id: 'new-task', label: 'Create New Task', icon: <Plus className="w-4 h-4" />, action: () => navigate('/tasks'), category: 'Actions', keywords: ['add', 'create', 'todo'] },
    { id: 'ask-ai', label: 'Ask AI Coach', description: 'Get personalized advice', icon: <Zap className="w-4 h-4" />, action: () => navigate('/assistant'), category: 'Actions', keywords: ['help', 'advice', 'plan'] },
  ];

  const filtered = query.trim() === ''
    ? COMMANDS
    : COMMANDS.filter(cmd => {
        const q = query.toLowerCase();
        return cmd.label.toLowerCase().includes(q)
          || cmd.description?.toLowerCase().includes(q)
          || cmd.keywords?.some(k => k.includes(q))
          || cmd.category.toLowerCase().includes(q);
      });

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].action(); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, pages, actions..."
              className="flex-1 bg-transparent text-sm text-text-main placeholder-text-muted focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[10px] text-text-muted border border-border-subtle rounded-md">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {Object.entries(grouped).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                <Hash className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No commands found for "{query}"
              </div>
            ) : (
              Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{category}</p>
                  {cmds.map((cmd, i) => {
                    const globalIdx = filtered.indexOf(cmd);
                    const isSelected = globalIdx === selected;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelected(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isSelected ? 'bg-primary/10' : 'hover:bg-border-subtle/30'}`}
                      >
                        <span className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-text-muted'}`}>{cmd.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-text-main'}`}>{cmd.label}</p>
                          {cmd.description && <p className="text-xs text-text-muted">{cmd.description}</p>}
                        </div>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border-subtle flex items-center gap-4 text-[10px] text-text-muted">
            <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono">↵</kbd> Select</span>
            <span><kbd className="font-mono">Esc</kbd> Close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
