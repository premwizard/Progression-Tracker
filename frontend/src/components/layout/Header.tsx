import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, view, setView } = useAuth();

  return (
    <header className="app-header glass-panel">
      <div className="header-container">
        <div 
          className="logo" 
          onClick={() => setView(isAuthenticated ? 'dashboard' : 'home')} 
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-icon">🚀</span>
          <h1>Progression Tracker</h1>
        </div>
        {isAuthenticated && (
          <nav className="main-nav">
            <button 
              className={`nav-link-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-link-btn ${view === 'goals' ? 'active' : ''}`}
              onClick={() => setView('goals')}
            >
              Goals
            </button>
            <button 
              className={`nav-link-btn ${view === 'analytics' ? 'active' : ''}`}
              onClick={() => setView('analytics')}
            >
              Analytics
            </button>
          </nav>
        )}
        <div className="user-actions">
          {isAuthenticated && user ? (
            <div className="user-profile">
              <span className="user-name">
                {user.full_name || user.email.split('@')[0]}
              </span>
              <button className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            view !== 'login' && view !== 'register' && (
              <button className="btn" onClick={() => setView('login')}>
                Sign In
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
