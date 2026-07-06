import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Goal } from './GoalDetail';
import { GoalForm } from './GoalForm';
import './Goals.css';

interface GoalListProps {
  onSelectGoal: (goalId: string) => void;
  refreshTrigger: number;
  onRefresh: () => void;
}

export const GoalList: React.FC<GoalListProps> = ({ onSelectGoal, refreshTrigger, onRefresh }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchGoals = async () => {
    try {
      const data = await api.get<Goal[]>('/goals');
      setGoals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [refreshTrigger]);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  const averageProgress = totalGoals > 0 
    ? Math.round(goals.reduce((acc, curr) => acc + curr.progress, 0) / totalGoals) 
    : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your goals...</p>
      </div>
    );
  }

  return (
    <div className="goals-layout animate-fade-in">
      <div className="goals-header">
        <h2>Your Goals</h2>
        <button className="btn" onClick={() => setShowCreateModal(true)}>+ New Goal</button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="goals-stats-bar">
        <div className="stat-card">
          <h4>Total Goals</h4>
          <span className="stat-val">{totalGoals}</span>
        </div>
        <div className="stat-card">
          <h4>In Progress</h4>
          <span className="stat-val">{inProgressGoals}</span>
        </div>
        <div className="stat-card">
          <h4>Completed</h4>
          <span className="stat-val">{completedGoals}</span>
        </div>
        <div className="stat-card">
          <h4>Avg. Progress</h4>
          <span className="stat-val">{averageProgress}%</span>
        </div>
      </div>

      <div className="goals-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search goals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="empty-state glass-panel">
          <span>🎯</span>
          <p>No goals found. Create one to begin tracking!</p>
          <button className="btn" onClick={() => setShowCreateModal(true)} style={{ marginTop: '1rem' }}>
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {filteredGoals.map(goal => (
            <div key={goal.id} className="goal-card" onClick={() => onSelectGoal(goal.id)}>
              <div className="goal-card-header">
                <h3>{goal.title}</h3>
                <span className={`status-badge ${goal.status}`}>
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
              
              {goal.description && (
                <p className="goal-card-desc">
                  {goal.description.length > 100 
                    ? `${goal.description.slice(0, 100)}...` 
                    : goal.description}
                </p>
              )}

              <div className="progress-container">
                <div className="progress-info">
                  <span>Progress</span>
                  <span>{Math.round(goal.progress)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>

              <div className="goal-card-footer">
                <span>
                  {goal.tasks ? `${goal.tasks.filter(t => t.status === 'completed').length}/${goal.tasks.length} tasks` : '0 tasks'}
                </span>
                {goal.target_date && (
                  <span>
                    Due {new Date(goal.target_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <GoalForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
export default GoalList;
