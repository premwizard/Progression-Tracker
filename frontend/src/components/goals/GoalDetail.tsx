import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import './Goals.css';

export interface Task {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | null;
  progress: number;
  tasks: Task[];
}

interface GoalDetailProps {
  goalId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export const GoalDetail: React.FC<GoalDetailProps> = ({ goalId, onBack, onUpdate }) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const fetchGoalDetails = useCallback(async () => {
    try {
      const data = await api.get<Goal>(`/goals/${goalId}`);
      setGoal(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goal details');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoalDetails();
  }, [fetchGoalDetails]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (!goal) return;
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    try {
      // Optimistic update
      const updatedTasks = goal.tasks.map(t =>
        t.id === taskId ? { ...t, status: nextStatus } : t
      );
      // Calculate optimistic progress
      const total = updatedTasks.length;
      const completed = updatedTasks.filter(t => t.status === 'completed').length;
      const optimisticProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      setGoal({
        ...goal,
        progress: optimisticProgress,
        status: optimisticProgress === 100 ? 'completed' : optimisticProgress > 0 ? 'in_progress' : 'todo',
        tasks: updatedTasks
      });

      await api.put<Task>(`/goals/${goalId}/tasks/${taskId}`, { status: nextStatus });
      // Fetch full goal to sync state with server recalculations
      const refreshedGoal = await api.get<Goal>(`/goals/${goalId}`);
      setGoal(refreshedGoal);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      // Revert details
      fetchGoalDetails();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !goal) return;
    setAddingTask(true);
    try {
      await api.post<Task>(`/goals/${goalId}/tasks`, {
        title: newTaskTitle.trim(),
        description: null,
        status: 'todo'
      });
      setNewTaskTitle('');
      const refreshedGoal = await api.get<Goal>(`/goals/${goalId}`);
      setGoal(refreshedGoal);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!goal) return;
    try {
      await api.delete(`/goals/${goalId}/tasks/${taskId}`);
      const refreshedGoal = await api.get<Goal>(`/goals/${goalId}`);
      setGoal(refreshedGoal);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleDeleteGoal = async () => {
    if (!confirm('Are you sure you want to delete this goal? All sub-tasks will be soft-deleted.')) return;
    try {
      await api.delete(`/goals/${goalId}`);
      onUpdate();
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading goal details...</p>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="empty-state glass-panel">
        <span>⚠️</span>
        <p>{error || 'Goal not found'}</p>
        <button className="btn" onClick={onBack} style={{ marginTop: '1rem' }}>Back to Goals</button>
      </div>
    );
  }

  const activeTasks = goal.tasks || [];

  return (
    <div className="goal-detail-view glass-panel">
      <div className="goal-detail-header">
        <div className="goal-detail-header-left">
          <button className="btn secondary" onClick={onBack} style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem' }}>
            ← Back
          </button>
          <h3>{goal.title}</h3>
          {goal.description && <p className="goal-detail-desc">{goal.description}</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <span className={`status-badge ${goal.status}`}>{goal.status.replace('_', ' ')}</span>
          <button className="btn secondary" onClick={handleDeleteGoal} style={{ color: 'hsl(0, 84%, 60%)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            Delete Goal
          </button>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-info">
          <span>Overall Progression</span>
          <span>{Math.round(goal.progress)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${goal.progress}%` }}></div>
        </div>
      </div>

      <div className="checklist-section">
        <h4>Sub-tasks Checklist</h4>
        
        <form onSubmit={handleAddTask} className="add-task-form">
          <input
            type="text"
            className="add-task-input"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new task..."
            disabled={addingTask}
          />
          <button type="submit" className="btn" disabled={addingTask || !newTaskTitle.trim()}>
            {addingTask ? 'Adding...' : 'Add'}
          </button>
        </form>

        <div className="task-list">
          {activeTasks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              No tasks created yet. Add one above!
            </p>
          ) : (
            activeTasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-item-left">
                  <div
                    className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                    onClick={() => handleToggleTask(task.id, task.status)}
                  />
                  <span className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <button className="btn-icon" onClick={() => handleDeleteTask(task.id)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default GoalDetail;

