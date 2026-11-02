"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface ActivityOption {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  category?: string;
  daily_target?: number;
  metric_unit?: string;
}

export interface StoredTimerState {
  sessionId?: string;
  activityId?: string;
  status: TimerStatus;
  startTime: string | null;
  pauseStartTime: string | null;
  accumulatedPauseSeconds: number;
  notes?: string;
}

interface TimerContextType {
  status: TimerStatus;
  activeActivity: ActivityOption | null;
  availableActivities: ActivityOption[];
  liveElapsedSeconds: number;
  formattedDuration: string;
  targetProgressPercent: number;
  isModalOpen: boolean;
  notes: string;
  setNotes: (notes: string) => void;
  openTimer: (activityId?: string) => void;
  closeTimer: () => void;
  startTimer: (activityId: string, notes?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  finishTimer: (finalNotes?: string) => Promise<void>;
  discardTimer: () => Promise<void>;
  logManualSession: (activityId: string, startTime: string, endTime: string, notes?: string) => Promise<void>;
  refreshActivities: () => Promise<void>;
}

const STORAGE_KEY = 'progression_active_timer';

const DEFAULT_ACTIVITIES: ActivityOption[] = [
  { id: 'deep-work', name: 'Deep Work', icon: 'code', color: '#3B82F6', category: 'Engineering', daily_target: 120, metric_unit: 'minutes' },
  { id: 'reading', name: 'Reading & Research', icon: 'book-open', color: '#10B981', category: 'Learning', daily_target: 30, metric_unit: 'minutes' },
  { id: 'workout', name: 'Workout & Health', icon: 'activity', color: '#F97316', category: 'Health', daily_target: 45, metric_unit: 'minutes' },
];

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [accumulatedPauseSeconds, setAccumulatedPauseSeconds] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [availableActivities, setAvailableActivities] = useState<ActivityOption[]>(DEFAULT_ACTIVITIES);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0);

  // ── Fetch user activities ─────────────────────────────────────────
  const refreshActivities = useCallback(async () => {
    try {
      const data = await api.get<ActivityOption[]>('/activities');
      if (Array.isArray(data) && data.length > 0) {
        setAvailableActivities(data);
      }
    } catch {
      // Use fallback starter activities
    }
  }, []);

  useEffect(() => {
    refreshActivities();
  }, [refreshActivities]);

  // Active activity helper
  const activeActivity = availableActivities.find(a => a.id === activityId) || (activityId ? {
    id: activityId,
    name: 'Focus Activity',
    color: '#F97316',
    daily_target: 60,
  } : null);

  // ── Mathematical Invariant Computation ────────────────────────────
  // Formula: liveElapsedSeconds = (now - startTime) - accumulatedPauseSeconds
  // If paused: liveElapsedSeconds = (pauseStartTime - startTime) - accumulatedPauseSeconds
  const computeElapsed = useCallback(() => {
    if (status === 'idle' || !startTime) {
      return 0;
    }
    if (status === 'paused') {
      if (!pauseStartTime) return 0;
      const totalSpan = Math.floor((pauseStartTime.getTime() - startTime.getTime()) / 1000);
      const net = totalSpan - accumulatedPauseSeconds;
      return net > 0 ? net : 0;
    }
    const now = Date.now();
    const totalSpan = Math.floor((now - startTime.getTime()) / 1000);
    const net = totalSpan - accumulatedPauseSeconds;
    return net > 0 ? net : 0;
  }, [status, startTime, pauseStartTime, accumulatedPauseSeconds]);

  // High-frequency live tick
  useEffect(() => {
    setLiveElapsedSeconds(computeElapsed());
    if (status !== 'running') return;

    const interval = setInterval(() => {
      setLiveElapsedSeconds(computeElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [status, computeElapsed]);

  // ── Persist to LocalStorage ───────────────────────────────────────
  const saveToStorage = (
    s: TimerStatus,
    sid: string | null,
    aid: string | null,
    st: Date | null,
    pst: Date | null,
    aps: number,
    n: string
  ) => {
    if (typeof window === 'undefined') return;
    if (s === 'idle') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const state: StoredTimerState = {
      sessionId: sid ?? undefined,
      activityId: aid ?? undefined,
      status: s,
      startTime: st ? st.toISOString() : null,
      pauseStartTime: pst ? pst.toISOString() : null,
      accumulatedPauseSeconds: aps,
      notes: n,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // ── Recovery & Sync on Boot ───────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === 'undefined') return;

      // 1. Try restoring from backend active session
      try {
        const active = await api.get<any>('/tracking/sessions/active');
        if (active && active.id) {
          const s = (active.status === 'paused') ? 'paused' : 'running';
          const st = active.start_time ? new Date(active.start_time) : new Date();
          const pst = (s === 'paused' && active.last_pause_time) ? new Date(active.last_pause_time) : (s === 'paused' ? new Date() : null);
          const aps = active.paused_duration_seconds || 0;

          setStatus(s);
          setSessionId(active.id);
          setActivityId(active.activity_id);
          setStartTime(st);
          setPauseStartTime(pst);
          setAccumulatedPauseSeconds(aps);
          setNotes(active.notes || '');
          saveToStorage(s, active.id, active.activity_id, st, pst, aps, active.notes || '');
          return;
        }
      } catch {
        // Fall back to localStorage recovery below
      }

      // 2. Restore from localStorage if backend is unreachable or returned no session
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: StoredTimerState = JSON.parse(saved);
          if (parsed.status !== 'idle' && parsed.startTime) {
            const st = new Date(parsed.startTime);
            const pst = parsed.pauseStartTime ? new Date(parsed.pauseStartTime) : null;
            setStatus(parsed.status);
            setSessionId(parsed.sessionId || null);
            setActivityId(parsed.activityId || null);
            setStartTime(st);
            setPauseStartTime(pst);
            setAccumulatedPauseSeconds(parsed.accumulatedPauseSeconds || 0);
            setNotes(parsed.notes || '');
          }
        }
      } catch (err) {
        console.warn('Failed restoring timer state from storage:', err);
      }
    };

    restoreSession();
  }, []);

  // ── Formatting Utilities ──────────────────────────────────────────
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const formattedDuration = formatDuration(liveElapsedSeconds);

  // Target progress percentage (target in minutes)
  const targetSeconds = (activeActivity?.daily_target || 60) * 60;
  const targetProgressPercent = targetSeconds > 0
    ? Math.min(100, Math.round((liveElapsedSeconds / targetSeconds) * 100))
    : 0;

  // ── Actions ───────────────────────────────────────────────────────
  const openTimer = (actId?: string) => {
    if (actId) {
      setActivityId(actId);
    } else if (!activityId && availableActivities.length > 0) {
      setActivityId(availableActivities[0].id);
    }
    setIsModalOpen(true);
  };

  const closeTimer = () => {
    setIsModalOpen(false);
  };

  const startTimer = async (actId: string, customNotes?: string) => {
    const chosenActivityId = actId || activityId || (availableActivities[0]?.id ?? 'default');
    const now = new Date();
    setActivityId(chosenActivityId);
    setStartTime(now);
    setPauseStartTime(null);
    setAccumulatedPauseSeconds(0);
    setStatus('running');
    if (customNotes !== undefined) setNotes(customNotes);

    try {
      const res = await api.post<any>('/tracking/sessions/start', {
        activity_id: chosenActivityId,
        notes: customNotes || notes || undefined,
      });
      if (res && res.id) {
        setSessionId(res.id);
        saveToStorage('running', res.id, chosenActivityId, now, null, 0, customNotes || notes);
        return;
      }
    } catch {
      // Run offline / mock mode
    }
    saveToStorage('running', null, chosenActivityId, now, null, 0, customNotes || notes);
  };

  const pauseTimer = async () => {
    if (status !== 'running') return;
    const now = new Date();
    setStatus('paused');
    setPauseStartTime(now);

    if (sessionId) {
      try {
        await api.post(`/tracking/sessions/${sessionId}/pause`, { notes: notes || undefined });
      } catch {
        // Run offline
      }
    }
    saveToStorage('paused', sessionId, activityId, startTime, now, accumulatedPauseSeconds, notes);
  };

  const resumeTimer = async () => {
    if (status !== 'paused' || !pauseStartTime) return;
    const now = new Date();
    const pauseDeltaSeconds = Math.max(0, Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000));
    const newAccumulated = accumulatedPauseSeconds + pauseDeltaSeconds;

    setStatus('running');
    setPauseStartTime(null);
    setAccumulatedPauseSeconds(newAccumulated);

    if (sessionId) {
      try {
        await api.post(`/tracking/sessions/${sessionId}/resume`);
      } catch {
        // Run offline
      }
    }
    saveToStorage('running', sessionId, activityId, startTime, null, newAccumulated, notes);
  };

  const finishTimer = async (finalNotes?: string) => {
    const noteText = finalNotes !== undefined ? finalNotes : notes;
    const sid = sessionId;

    // Reset local timer state immediately
    setStatus('idle');
    setSessionId(null);
    setStartTime(null);
    setPauseStartTime(null);
    setAccumulatedPauseSeconds(0);
    setNotes('');
    setLiveElapsedSeconds(0);
    setIsModalOpen(false);
    saveToStorage('idle', null, null, null, null, 0, '');

    if (sid) {
      try {
        await api.post(`/tracking/sessions/${sid}/finish`, { notes: noteText || undefined });
      } catch (err) {
        console.warn('Failed completing backend session:', err);
      }
    }

    // Dispatch custom event so Heatmaps and charts know to refresh data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session_completed'));
    }
  };

  const discardTimer = async () => {
    const sid = sessionId;
    setStatus('idle');
    setSessionId(null);
    setStartTime(null);
    setPauseStartTime(null);
    setAccumulatedPauseSeconds(0);
    setNotes('');
    setLiveElapsedSeconds(0);
    setIsModalOpen(false);
    saveToStorage('idle', null, null, null, null, 0, '');

    if (sid) {
      try {
        await api.post(`/tracking/sessions/${sid}/cancel`);
      } catch {
        // Ignore failure on discard
      }
    }
  };

  const logManualSession = async (
    actId: string,
    startIso: string,
    endIso: string,
    manualNotes?: string
  ) => {
    try {
      await api.post('/tracking/sessions/manual', {
        activity_id: actId,
        start_time: startIso,
        end_time: endIso,
        notes: manualNotes || undefined,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session_completed'));
      }
    } catch (err: any) {
      console.error('Failed to log manual session:', err);
      throw err;
    }
  };

  return (
    <TimerContext.Provider
      value={{
        status,
        activeActivity,
        availableActivities,
        liveElapsedSeconds,
        formattedDuration,
        targetProgressPercent,
        isModalOpen,
        notes,
        setNotes,
        openTimer,
        closeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        finishTimer,
        discardTimer,
        logManualSession,
        refreshActivities,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
