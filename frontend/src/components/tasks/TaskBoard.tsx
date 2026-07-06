import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import './Tasks.css';

interface Task {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  goal_title: string | null;
  created_at: string;
}

interface Goal {
  id: string;
  title: string;
}

export const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, goalsData] = await Promise.all([
        api.get<Task[]>('/tasks'),
        api.get<Goal[]>('/goals')
      ]);
      setTasks(tasksData);
      setGoals(goalsData);
      
      if (goalsData.length > 0 && !selectedGoalId) {
        setSelectedGoalId(goalsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task board data');
    } finally {
      setLoading(false);
    }
  }, [selectedGoalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to change task status');
      fetchData();
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    try {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, priority: newPriority } : t))
      );
      await api.put(`/tasks/${taskId}`, { priority: newPriority });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to change task priority');
      fetchData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await api.delete(`/tasks/${taskId}`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      fetchData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedGoalId) return;
    setSubmittingTask(true);
    try {
      await api.post(`/goals/${selectedGoalId}/tasks`, {
        title: newTaskTitle.trim(),
        description: null,
        status: 'todo',
        priority: newTaskPriority,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null
      });
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = goalFilter === 'all' || task.goal_id === goalFilter;
    return matchesSearch && matchesGoal;
  });

  const getColumnTasks = (status: string) => {
    return filteredTasks.filter(t => t.status === status);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading task board...</p>
      </div>
    );
  }

  return (
    <div className="tasks-layout animate-fade-in">
      <div className="tasks-header">
        <h2>Task Board</h2>
        <button 
          className="btn" 
          onClick={() => setShowAddModal(true)}
          disabled={goals.length === 0}
          title={goals.length === 0 ? 'Create a goal first' : ''}
        >
          + Add Task
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="task-board-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Filter tasks by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="task-filter-select"
          value={goalFilter}
          onChange={(e) => setGoalFilter(e.target.value)}
        >
          <option value="all">All Goals</option>
          {goals.map(g => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      </div>

      <div className="kanban-board">
        <div className="kanban-column todo">
          <div className="column-header">
            <h3>📋 To Do</h3>
            <span className="task-count">{getColumnTasks('todo').length}</span>
          </div>
          <div className="column-cards-container">
            {getColumnTasks('todo').map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        </div>

        <div className="kanban-column in-progress">
          <div className="column-header">
            <h3>⚡ In Progress</h3>
            <span className="task-count">{getColumnTasks('in_progress').length}</span>
          </div>
          <div className="column-cards-container">
            {getColumnTasks('in_progress').map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        </div>

        <div className="kanban-column completed">
          <div className="column-header">
            <h3>✅ Completed</h3>
            <span className="task-count">{getColumnTasks('completed').length}</span>
          </div>
          <div className="column-cards-container">
            {getColumnTasks('completed').map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="dialog-overlay">
          <div className="dialog-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Add Task</h3>
            
            <form onSubmit={handleCreateTask} className="auth-form">
              <div className="form-group">
                <label htmlFor="task-title">Task Title *</label>
                <input
                  id="task-title"
                  type="text"
                  className="form-input"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Write integration tests"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="parent-goal">Parent Goal *</label>
                <select
                  id="parent-goal"
                  className="form-input"
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  required
                >
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="form-input"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-due">Due Date</label>
                <input
                  id="task-due"
                  type="date"
                  className="form-input"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowAddModal(false)} disabled={submittingTask}>Cancel</button>
                <button type="submit" className="btn" disabled={submittingTask || !newTaskTitle.trim()}>
                  {submittingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onPriorityChange, onDelete }) => {
  return (
    <div className="task-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h4 style={{ wordBreak: 'break-word' }}>{task.title}</h4>
        <button className="btn-icon" onClick={() => onDelete(task.id)} style={{ padding: '2px', alignSelf: 'flex-start' }}>✕</button>
      </div>

      <div className="task-card-meta">
        {task.goal_title && <span className="goal-badge" title={task.goal_title}>{task.goal_title}</span>}
        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
      </div>

      <div className="task-card-footer">
        <div className="task-due">
          {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
        </div>
        
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <select
            className="task-status-select"
            value={task.priority}
            onChange={(e) => onPriorityChange(task.id, e.target.value)}
            style={{ width: '70px' }}
          >
            <option value="low">Low</option>
            <option value="medium">Med</option>
            <option value="high">High</option>
          </select>

          <select
            className="task-status-select"
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            style={{ width: '80px' }}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Prog</option>
            <option value="completed">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
};
export default TaskBoard;

