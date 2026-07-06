import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './Analytics.css';

interface WeeklyVelocityPoint {
  day: string;
  count: number;
}

interface PriorityBreakdown {
  low: number;
  medium: number;
  high: number;
}

interface AnalyticsSummary {
  total_goals: number;
  completed_goals: number;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  weekly_velocity: WeeklyVelocityPoint[];
  priority_breakdown: PriorityBreakdown;
  streak_count: number;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: string;
}

export const Analytics: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [summaryData, goalsData] = await Promise.all([
          api.get<AnalyticsSummary>('/analytics/summary'),
          api.get<Goal[]>('/goals')
        ]);
        setSummary(summaryData);
        setGoals(goalsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics summaries');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading progression intelligence...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="empty-state glass-panel">
        <span>⚠️</span>
        <p>{error || 'Analytics not available'}</p>
      </div>
    );
  }

  // --- SVG Line Chart (Velocity) Calculations ---
  const chartWidth = 500;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = chartWidth - paddingX * 2;
  const graphHeight = chartHeight - paddingY * 2;

  // Find max value for scaling velocity
  const velocityPoints = summary.weekly_velocity || [];
  const maxVelocity = Math.max(...velocityPoints.map(p => p.count), 5); // Default scale max to at least 5

  const pointsString = velocityPoints
    .map((point, index) => {
      const x = paddingX + (index * graphWidth) / (velocityPoints.length - 1);
      const y = paddingY + graphHeight - (point.count / maxVelocity) * graphHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Create path for area under the line
  const areaPointsString = velocityPoints.length > 0
    ? `${paddingX},${paddingY + graphHeight} ${pointsString} ${paddingX + graphWidth},${paddingY + graphHeight}`
    : '';

  // --- Donut Chart (Priority) Calculations ---
  const breakdown = summary.priority_breakdown;
  const totalPending = breakdown.low + breakdown.medium + breakdown.high;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // Approx 314.16

  const highPct = totalPending > 0 ? breakdown.high / totalPending : 0;
  const mediumPct = totalPending > 0 ? breakdown.medium / totalPending : 0;
  const lowPct = totalPending > 0 ? breakdown.low / totalPending : 0;

  const highStroke = highPct * circumference;
  const mediumStroke = mediumPct * circumference;
  const lowStroke = lowPct * circumference;

  const highOffset = 0;
  const mediumOffset = -highStroke;
  const lowOffset = -(highStroke + mediumStroke);

  return (
    <div className="analytics-layout animate-fade-in">
      <div className="analytics-header">
        <h2>Progression Intelligence</h2>
      </div>

      {/* Metrics Row */}
      <div className="analytics-metrics-grid">
        <div className="stat-card">
          <h4>Goal Completion</h4>
          <span className="stat-val">{summary.completed_goals} / {summary.total_goals}</span>
          <span className="card-desc" style={{ marginTop: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Goals completed successfully
          </span>
        </div>
        <div className="stat-card">
          <h4>Task Completion</h4>
          <span className="stat-val">{summary.completed_tasks} / {summary.total_tasks}</span>
          <span className="card-desc" style={{ marginTop: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Total subtasks checklist
          </span>
        </div>
        <div className="stat-card">
          <h4>Task Success Rate</h4>
          <span className="stat-val">{Math.round(summary.completion_rate)}%</span>
          <span className="card-desc" style={{ marginTop: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Checklist finish percentage
          </span>
        </div>
        <div className="stat-card">
          <h4>Active Streak</h4>
          <span className="stat-val">🔥 {summary.streak_count} {summary.streak_count === 1 ? 'Day' : 'Days'}</span>
          <span className="card-desc" style={{ marginTop: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Consecutive completion days
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Weekly Velocity */}
        <div className="chart-card">
          <h3>Task Velocity (Last 7 Days)</h3>
          <div className="chart-container">
            {velocityPoints.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No data points available</p>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = paddingY + ratio * graphHeight;
                  return (
                    <line
                      key={index}
                      x1={paddingX}
                      y1={y}
                      x2={paddingX + graphWidth}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Gradient area under line */}
                {areaPointsString && (
                  <polygon points={areaPointsString} fill="url(#areaGradient)" />
                )}

                {/* Stroke line */}
                {pointsString && (
                  <polyline
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    points={pointsString}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data point circles and labels */}
                {velocityPoints.map((point, index) => {
                  const x = paddingX + (index * graphWidth) / (velocityPoints.length - 1);
                  const y = paddingY + graphHeight - (point.count / maxVelocity) * graphHeight;
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="var(--surface)"
                        stroke="var(--primary)"
                        strokeWidth="3"
                      />
                      {point.count > 0 && (
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          fill="var(--text-primary)"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {point.count}
                        </text>
                      )}
                      <text
                        x={x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill="var(--text-secondary)"
                        fontSize="11"
                        fontWeight="600"
                      >
                        {point.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Priority Breakdown Donut */}
        <div className="chart-card">
          <h3>Pending Priorities</h3>
          <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {totalPending === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🎯</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  No pending tasks remaining. Inbox zero!
                </p>
              </div>
            ) : (
              <>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="var(--border)"
                    strokeWidth={strokeWidth}
                  />
                  {/* High priority */}
                  {highStroke > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="hsl(0, 84%, 60%)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${highStroke} ${circumference}`}
                      strokeDashoffset={highOffset}
                    />
                  )}
                  {/* Medium priority */}
                  {mediumStroke > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="hsl(35, 92%, 50%)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${mediumStroke} ${circumference}`}
                      strokeDashoffset={mediumOffset}
                    />
                  )}
                  {/* Low priority */}
                  {lowStroke > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke="hsl(217, 91%, 55%)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${lowStroke} ${circumference}`}
                      strokeDashoffset={lowOffset}
                    />
                  )}
                </svg>

                {/* Legends */}
                <div className="donut-legend">
                  <div className="legend-item">
                    <span className="legend-color high"></span>
                    <span>High priority: <strong>{breakdown.high}</strong></span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color medium"></span>
                    <span>Medium priority: <strong>{breakdown.medium}</strong></span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color low"></span>
                    <span>Low priority: <strong>{breakdown.low}</strong></span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Goal Leaderboard */}
      <div className="chart-card">
        <h3>Goal Performance Leaderboard</h3>
        {goals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
            No goals created yet.
          </p>
        ) : (
          <div className="leaderboard-list">
            {[...goals]
              .sort((a, b) => b.progress - a.progress)
              .map(goal => (
                <div key={goal.id} className="leaderboard-item">
                  <div className="leaderboard-info">
                    <span className="leaderboard-name">{goal.title}</span>
                    <span className="leaderboard-meta">
                      Status: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{goal.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <div className="leaderboard-progress-container">
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-bar" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                    <span className="leaderboard-progress-val">{Math.round(goal.progress)}%</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Analytics;

