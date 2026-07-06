import React, { useState } from 'react';
import { api } from '../../services/api';
import './Goals.css';

interface GoalFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [tasks, setTasks] = useState<{ title: string; description: string }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { title: newTaskTitle.trim(), description: '' }]);
    setNewTaskTitle('');
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Goal title is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/goals', {
        title: title.trim(),
        description: description.trim() || null,
        target_date: targetDate ? new Date(targetDate).toISOString() : null,
        tasks: tasks.map(t => ({ title: t.title, description: null, status: 'todo' })),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content glass-panel">
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Create New Goal</h3>
        {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="goal-title">Goal Title *</label>
            <input
              id="goal-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Learn React 19"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-desc">Description</label>
            <textarea
              id="goal-desc"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to accomplish?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-target">Target Completion Date</label>
            <input
              id="goal-target"
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label>Sub-tasks (Optional)</label>
            <div className="add-task-form">
              <input
                type="text"
                className="add-task-input"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add sub-task..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask(e);
                  }
                }}
              />
              <button type="button" className="btn" onClick={handleAddTask}>Add</button>
            </div>
            
            {tasks.length > 0 && (
              <div className="task-list" style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                {tasks.map((task, i) => (
                  <div key={i} className="task-item" style={{ padding: '0.4rem 0.8rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>{task.title}</span>
                    <button type="button" className="btn-icon" onClick={() => handleRemoveTask(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default GoalForm;
