"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar, Clock, CheckCircle2, ChevronDown, X, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export interface HeatmapDayCell {
  date: string;
  intensity_level: number;
  total_duration_seconds: number;
  total_quantity: number;
  completions_count: number;
  is_active: boolean;
}

export interface HeatmapActivityInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
  category: string;
  metric_unit?: string;
  daily_target?: number;
}

export interface HeatmapGridData {
  start_date: string;
  end_date: string;
  total_days: number;
  active_days: number;
  consistency_percentage: number;
  current_streak: number;
  longest_streak: number;
  total_duration_seconds: number;
  total_quantity: number;
  total_completions: number;
  activity?: HeatmapActivityInfo | null;
  level_counts: Record<string, number>;
  cells: HeatmapDayCell[];
}

export interface DaySessionDrilldown {
  id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  status: string;
  notes?: string;
}

export interface DayActivityDrilldown {
  activity_id: string;
  activity_name: string;
  activity_color: string;
  activity_icon: string;
  activity_category: string;
  metric_unit?: string;
  total_duration_seconds: number;
  total_quantity: number;
  is_completed: boolean;
  intensity_level: number;
  sessions: DaySessionDrilldown[];
}

export interface HeatmapDrilldownResponse {
  target_date: string;
  overall_intensity: number;
  total_duration_seconds: number;
  total_quantity: number;
  total_completions: number;
  activities: DayActivityDrilldown[];
}

interface ActivityItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  category: string;
}

export const HeatmapGrid: React.FC = () => {
  const [gridData, setGridData] = useState<HeatmapGridData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('overall');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ cell: HeatmapDayCell; x: number; y: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<HeatmapDrilldownResponse | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // Fetch activities list
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get<ActivityItem[]>('/activities');
        if (res && Array.isArray(res)) {
          setActivities(res);
        }
      } catch {
        // Fallback demo activities
        setActivities([
          { id: '1', name: 'System Coding', color: '#3B82F6', icon: 'code', category: 'Projects' },
          { id: '2', name: 'Gym Workout', color: '#F97316', icon: 'dumbbell', category: 'Fitness' },
          { id: '3', name: 'System Design', color: '#A855F7', icon: 'book', category: 'Career' },
        ]);
      }
    };
    fetchActivities();
  }, []);

  // Fetch heatmap grid data
  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedYear) queryParams.append('year', selectedYear.toString());

        const endpoint =
          selectedActivityId === 'overall'
            ? `/heatmaps/overall${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
            : `/heatmaps/activity/${selectedActivityId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const res = await api.get<HeatmapGridData>(endpoint);
        if (res && res.cells) {
          setGridData(res);
        } else {
          setGridData(generateFallbackHeatmap(selectedYear));
        }
      } catch {
        setGridData(generateFallbackHeatmap(selectedYear));
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [selectedActivityId, selectedYear]);

  // Fetch drilldown when a cell is clicked
  const handleCellClick = async (cell: HeatmapDayCell) => {
    setSelectedDate(cell.date);
    setDrilldownLoading(true);
    try {
      const query = new URLSearchParams({ date: cell.date });
      if (selectedActivityId !== 'overall') {
        query.append('activity_id', selectedActivityId);
      }
      const res = await api.get<HeatmapDrilldownResponse>(`/heatmaps/drilldown?${query.toString()}`);
      setDrilldownData(res);
    } catch {
      // Mock drilldown for offline preview
      setDrilldownData({
        target_date: cell.date,
        overall_intensity: cell.intensity_level,
        total_duration_seconds: cell.total_duration_seconds,
        total_quantity: cell.total_quantity,
        total_completions: cell.completions_count,
        activities: [
          {
            activity_id: 'fallback-1',
            activity_name: selectedActivityId === 'overall' ? 'Focus Session' : 'Tracked Session',
            activity_color: '#F97316',
            activity_icon: 'activity',
            activity_category: 'Personal',
            total_duration_seconds: cell.total_duration_seconds || 1800,
            total_quantity: cell.total_quantity,
            is_completed: cell.completions_count > 0,
            intensity_level: cell.intensity_level,
            sessions: [
              {
                id: 'sess-1',
                start_time: `${cell.date}T10:00:00Z`,
                duration_seconds: cell.total_duration_seconds || 1800,
                status: 'completed',
                notes: 'Productive progress session completed.',
              },
            ],
          },
        ],
      });
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Group cells into 7-day columns (weeks)
  const { weeks, monthHeaders } = useMemo(() => {
    if (!gridData || !gridData.cells || gridData.cells.length === 0) {
      return { weeks: [], monthHeaders: [] };
    }

    const cells = gridData.cells;
    const firstDate = new Date(cells[0].date);
    // JavaScript getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
    // Convert to Monday = 0, Sunday = 6
    const dayOfWeek = (firstDate.getDay() + 6) % 7;

    const weekColumns: (HeatmapDayCell | null)[][] = [];
    let currentWeek: (HeatmapDayCell | null)[] = Array(dayOfWeek).fill(null);

    cells.forEach((cell) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        weekColumns.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weekColumns.push(currentWeek);
    }

    // Determine month labels based on first valid day of each week
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const headers: { colIndex: number; label: string }[] = [];
    let lastMonth = -1;

    weekColumns.forEach((week, colIndex) => {
      const valid = week.find((c) => c !== null);
      if (valid) {
        const m = new Date(valid.date).getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          headers.push({ colIndex, label: months[m] });
        }
      }
    });

    return { weeks: weekColumns, monthHeaders: headers };
  }, [gridData]);

  // Dynamic intensity colors
  const getCellColor = (level: number) => {
    if (gridData?.activity?.color) {
      const hex = gridData.activity.color;
      switch (level) {
        case 1:
          return `${hex}40`; // 25% opacity
        case 2:
          return `${hex}75`; // 46% opacity
        case 3:
          return `${hex}B3`; // 70% opacity
        case 4:
          return hex; // 100%
        default:
          return 'rgba(255, 255, 255, 0.04)';
      }
    }

    // Default GitHub emerald progression
    switch (level) {
      case 1:
        return '#0e4429';
      case 2:
        return '#006d32';
      case 3:
        return '#26a641';
      case 4:
        return '#39d353';
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="p-6 glass rounded-2xl border border-border-subtle relative">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              Progression Consistency Heatmap
              <Sparkles className="w-4 h-4 text-accent" />
            </h2>
            <p className="text-xs text-text-muted">
              Quantified daily progression across all activities over time
            </p>
          </div>
        </div>

        {/* Filters: Activity dropdown & Year switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="appearance-none bg-surface/80 border border-border-subtle rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-text-main hover:border-primary/50 transition-colors cursor-pointer outline-none"
            >
              <option value="overall">All Activities (Overall)</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-xl border border-border-subtle text-xs">
            <button
              onClick={() => setSelectedYear(null)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedYear === null
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Past 365d
            </button>
            <button
              onClick={() => setSelectedYear(2026)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedYear === 2026
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              2026
            </button>
            <button
              onClick={() => setSelectedYear(2025)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedYear === 2025
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              2025
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {gridData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-surface/40 border border-border-subtle/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Active Days</p>
              <p className="text-sm font-bold text-text-main">
                {gridData.active_days} <span className="text-xs text-text-muted font-normal">/ {gridData.total_days} ({gridData.consistency_percentage}%)</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface/40 border border-border-subtle/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Current Streak</p>
              <p className="text-sm font-bold text-text-main">
                {gridData.current_streak} days
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface/40 border border-border-subtle/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Longest Streak</p>
              <p className="text-sm font-bold text-text-main">
                {gridData.longest_streak} days
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface/40 border border-border-subtle/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Total Tracked</p>
              <p className="text-sm font-bold text-text-main">
                {formatDuration(gridData.total_duration_seconds)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap 53-Week Canvas Grid */}
      <div className="overflow-x-auto pb-3 custom-scrollbar">
        <div className="min-w-[760px]">
          {/* Month Headers */}
          <div className="flex text-[10px] text-text-muted font-medium mb-1.5 pl-7">
            {weeks.map((_, colIdx) => {
              const header = monthHeaders.find((h) => h.colIndex === colIdx);
              return (
                <div key={colIdx} className="w-[14px] text-left shrink-0">
                  {header ? header.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid Rows: Mon to Sun */}
          <div className="flex gap-1.5">
            {/* Weekday indicators */}
            <div className="flex flex-col gap-1 text-[9px] text-text-muted font-medium pr-1 pt-0.5 shrink-0">
              <span className="h-[12px] leading-[12px]">Mon</span>
              <span className="h-[12px] leading-[12px] opacity-0">Tue</span>
              <span className="h-[12px] leading-[12px]">Wed</span>
              <span className="h-[12px] leading-[12px] opacity-0">Thu</span>
              <span className="h-[12px] leading-[12px]">Fri</span>
              <span className="h-[12px] leading-[12px] opacity-0">Sat</span>
              <span className="h-[12px] leading-[12px] opacity-0">Sun</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((cell, di) => {
                    if (!cell) {
                      return <div key={di} className="w-3 h-3 rounded-[2.5px] bg-transparent" />;
                    }

                    const isSelected = selectedDate === cell.date;

                    return (
                      <button
                        key={cell.date}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({ cell, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          backgroundColor: getCellColor(cell.intensity_level),
                          borderColor: isSelected
                            ? '#F97316'
                            : cell.intensity_level === 0
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'transparent',
                        }}
                        className={`w-3 h-3 rounded-[2.5px] border transition-transform hover:scale-125 focus:scale-125 focus:outline-none ${
                          isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-black' : ''
                        }`}
                        aria-label={`${cell.date}: Level ${cell.intensity_level}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border-subtle/50 mt-2">
        <span className="text-[11px]">
          {gridData?.activity ? `Viewing: ${gridData.activity.name}` : 'Combined Progression Score'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              style={{
                backgroundColor: getCellColor(level),
                borderColor: level === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
              className="w-3 h-3 rounded-[2px] border"
            />
          ))}
          <span className="text-[11px]">More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 10}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 100,
          }}
          className="bg-neutral-900/95 backdrop-blur-md text-white text-[11px] px-3 py-2 rounded-xl shadow-2xl border border-white/10 whitespace-nowrap"
        >
          <p className="font-semibold text-text-main flex items-center gap-1.5">
            <span>{hoveredCell.cell.date}</span>
            <span className="text-[10px] text-primary font-bold">
              Level {hoveredCell.cell.intensity_level}
            </span>
          </p>
          <div className="text-text-muted text-[10px] mt-0.5 flex items-center gap-2">
            {hoveredCell.cell.total_duration_seconds > 0 && (
              <span>⏱️ {formatDuration(hoveredCell.cell.total_duration_seconds)}</span>
            )}
            {hoveredCell.cell.total_quantity > 0 && (
              <span>🔢 +{hoveredCell.cell.total_quantity}</span>
            )}
            {hoveredCell.cell.completions_count > 0 && (
              <span>✅ {hoveredCell.cell.completions_count} completed</span>
            )}
            {hoveredCell.cell.intensity_level === 0 && <span>No activity recorded</span>}
          </div>
        </div>
      )}

      {/* Date Drilldown Modal Drawer */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-4 rounded-xl bg-surface/90 border border-primary/30 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-main">
                  Date Breakdown: {selectedDate}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {drilldownLoading ? (
              <div className="py-6 text-center text-xs text-text-muted">Loading breakdown details...</div>
            ) : drilldownData && drilldownData.activities.length > 0 ? (
              <div className="space-y-3">
                {drilldownData.activities.map((act) => (
                  <div
                    key={act.activity_id}
                    className="p-3 rounded-lg bg-neutral-950/40 border border-border-subtle flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: act.activity_color }}
                          className="w-2.5 h-2.5 rounded-full"
                        />
                        <span className="text-xs font-semibold text-text-main">
                          {act.activity_name}
                        </span>
                        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-white/5">
                          {act.activity_category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {act.total_duration_seconds > 0 && (
                          <span className="font-bold text-primary">
                            {formatDuration(act.total_duration_seconds)}
                          </span>
                        )}
                        {act.total_quantity > 0 && (
                          <span className="font-bold text-emerald-400">
                            +{act.total_quantity} {act.metric_unit || ''}
                          </span>
                        )}
                        {act.is_completed && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                    </div>

                    {act.sessions && act.sessions.length > 0 && (
                      <div className="text-[11px] text-text-muted space-y-1 pl-4 border-l border-white/10 mt-1">
                        {act.sessions.map((s) => (
                          <div key={s.id} className="flex justify-between items-center">
                            <span>{s.notes || 'Tracked Session'}</span>
                            <span className="text-text-main font-mono">
                              {formatDuration(s.duration_seconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted py-2">
                No individual sessions or logs recorded on this calendar day.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Fallback generator for smooth preview without backend dependency
function generateFallbackHeatmap(year: number | null): HeatmapGridData {
  const today = new Date();
  const endDate = year ? new Date(year, 11, 31) : today;
  const startDate = year
    ? new Date(year, 0, 1)
    : new Date(today.getTime() - 364 * 86400000);

  const cells: HeatmapDayCell[] = [];
  const levelCounts: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };
  let activeDays = 0;
  let totalDur = 0;
  let totalQty = 0;

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
    const seed = (cur.getTime() / 86400000) % 10;
    let level = 0;
    if (!isWeekend) {
      if (seed > 8) level = 4;
      else if (seed > 6) level = 3;
      else if (seed > 4) level = 2;
      else if (seed > 2) level = 1;
    } else if (seed > 7) {
      level = 2;
    }

    const dur = level * 1800;
    const qty = level * 10;
    const isActive = level > 0;

    cells.push({
      date: cur.toISOString().split('T')[0],
      intensity_level: level,
      total_duration_seconds: dur,
      total_quantity: qty,
      completions_count: level >= 2 ? 1 : 0,
      is_active: isActive,
    });

    levelCounts[level.toString()] = (levelCounts[level.toString()] || 0) + 1;
    if (isActive) activeDays++;
    totalDur += dur;
    totalQty += qty;

    cur.setDate(cur.getDate() + 1);
  }

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    total_days: cells.length,
    active_days: activeDays,
    consistency_percentage: Number(((activeDays / cells.length) * 100).toFixed(1)),
    current_streak: 5,
    longest_streak: 18,
    total_duration_seconds: totalDur,
    total_quantity: totalQty,
    total_completions: Math.floor(activeDays * 0.7),
    level_counts: levelCounts,
    cells,
  };
}

