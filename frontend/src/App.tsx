import React from 'react';
import { Header } from './components/layout/Header';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const AppContent: React.FC = () => {
  const { view, setView, user, isLoading, isAuthenticated } = useAuth();

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

  const renderContent = () => {
    switch (view) {
      case 'login':
        return <Login />;
      case 'register':
        return <Register />;
      case 'dashboard':
        return (
          <div className="dashboard-view animate-fade-in">
            <div className="welcome-banner glass-panel">
              <h2>Welcome back, {user?.full_name || user?.email}! 👋</h2>
              <p>Here is your progression overview for today. Let's make some headway on your goals.</p>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-card glass-panel">
                <h3>Active Goals</h3>
                <p className="card-value">0</p>
                <span className="card-desc">No active goals yet. Click below to add one.</span>
                <button className="btn btn-sm" style={{ marginTop: 'var(--spacing-md)' }}>+ Create Goal</button>
              </div>
              <div className="dashboard-card glass-panel">
                <h3>Tasks Done</h3>
                <p className="card-value">0%</p>
                <span className="card-desc">Keep going! Success is built task by task.</span>
              </div>
              <div className="dashboard-card glass-panel">
                <h3>Daily Streak</h3>
                <p className="card-value">🔥 0</p>
                <span className="card-desc">Complete a task daily to keep the fire burning.</span>
              </div>
            </div>
          </div>
        );
      case 'goals':
        return (
          <div className="dashboard-view animate-fade-in">
            <div className="welcome-banner glass-panel">
              <h2>Your Goals</h2>
              <p>Define, track, and manage your long-term and short-term goals.</p>
            </div>
            <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
              <p>Goal creation and listing will be implemented in the next sprint.</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="dashboard-view animate-fade-in">
            <div className="welcome-banner glass-panel">
              <h2>Analytics & Progression Insights</h2>
              <p>Visualize your progress, velocity, and achievements over time.</p>
            </div>
            <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
              <p>AI insights and progression charts are coming soon.</p>
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
