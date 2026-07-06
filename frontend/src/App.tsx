import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { GoalList } from './components/goals/GoalList';
import { GoalDetail } from './components/goals/GoalDetail';
import { TaskBoard } from './components/tasks/TaskBoard';
import { Analytics } from './components/analytics/Analytics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import './App.css';

const AppContent: React.FC = () => {
  const { view, setView, user, isLoading, isAuthenticated } = useAuth();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  // Fetch summary data for the dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthenticated && user) {
        try {
          const [goalsData, tasksData, analyticsSummary] = await Promise.all([
            api.get<any[]>('/goals'),
            api.get<any[]>('/tasks'),
            api.get<any>('/analytics/summary')
          ]);
          setGoals(goalsData);
          setTasks(tasksData);
          setStreak(analyticsSummary.streak_count);
        } catch (err) {
          console.error('Failed to fetch dashboard data:', err);
        }
      }
    };
    fetchDashboardData();
  }, [view, user, isAuthenticated, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner glass-panel">
          <div className="spinner-inner"></div>
          <p>Initializing Progression Tracker...</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic dashboard stats
  const activeGoalsCount = goals.filter(g => g.status !== 'completed' && g.status !== 'archived').length;
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  const renderContent = () => {
    switch (view) {
      case 'login':
        return <Login />;
      case 'register':
        return <Register />;
      case 'goals':
        return selectedGoalId ? (
          <GoalDetail
            goalId={selectedGoalId}
            onBack={() => setSelectedGoalId(null)}
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        ) : (
          <GoalList
            onSelectGoal={setSelectedGoalId}
            refreshTrigger={refreshTrigger}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        );
      case 'tasks':
        return <TaskBoard />;
      case 'analytics':
        return <Analytics />;
      case 'dashboard':
        return (
          <div className="dashboard-view animate-fade-in">
            <div className="welcome-banner glass-panel">
              <h2>Welcome back, {user?.full_name || user?.email}! 👋</h2>
              <p>Here is your progression overview for today. Let's make some headway on your goals.</p>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-card glass-panel" style={{ cursor: 'pointer' }} onClick={() => setView('goals')}>
                <h3>Active Goals</h3>
                <p className="card-value">{activeGoalsCount}</p>
                <span className="card-desc">
                  {activeGoalsCount > 0 ? 'Click to view active milestones' : 'No active goals yet. Click to create one.'}
                </span>
                {activeGoalsCount === 0 && (
                  <button className="btn btn-sm" style={{ marginTop: 'var(--spacing-md)' }}>+ Create Goal</button>
                )}
              </div>
              <div className="dashboard-card glass-panel" style={{ cursor: 'pointer' }} onClick={() => setView('tasks')}>
                <h3>Tasks Completed</h3>
                <p className="card-value">{completedTasksCount} / {totalTasksCount}</p>
                <span className="card-desc">
                  {totalTasksCount > 0 ? 'Click to manage your Kanban task board' : 'Add tasks to your goals to track them'}
                </span>
              </div>
              <div className="dashboard-card glass-panel" style={{ cursor: 'pointer' }} onClick={() => setView('analytics')}>
                <h3>Daily Streak</h3>
                <p className="card-value">🔥 {streak}</p>
                <span className="card-desc">
                  {streak > 0 ? 'Keep the fire burning! Complete a task daily.' : 'Complete a task today to start a streak'}
                </span>
              </div>
            </div>
          </div>
        );
      case 'home':
      default:
        return (
          <section className="hero glass-panel animate-fade-in">
            <h2>Welcome to Progression Tracker</h2>
            <p>Your AI-Powered Goal Planning and Productivity Intelligence Platform.</p>
            <div className="hero-actions">
              <button 
                className="btn" 
                onClick={() => setView(isAuthenticated ? 'dashboard' : 'login')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </button>
              <button className="btn secondary">View Documentation</button>
            </div>
          </section>
        );
    }
  };

  return (
    <div className="app-root">
      <Header />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
