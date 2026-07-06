import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="app-header glass-panel">
      <div className="header-container">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <h1>Progression Tracker</h1>
        </div>
        <nav className="main-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#goals">Goals</a>
          <a href="#analytics">Analytics</a>
        </nav>
        <div className="user-actions">
          <button className="btn">Sign In</button>
        </div>
      </div>
    </header>
  );
};
