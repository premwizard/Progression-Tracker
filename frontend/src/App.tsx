import React from 'react';
import { Header } from './components/layout/Header';
import './App.css';

function App() {
  return (
    <div className="app-root animate-fade-in">
      <Header />
      <main className="main-content">
        <section className="hero glass-panel">
          <h2>Welcome to Progression Tracker</h2>
          <p>Your AI-Powered Goal Planning and Productivity Intelligence Platform.</p>
          <div className="hero-actions">
            <button className="btn">Get Started</button>
            <button className="btn secondary">View Documentation</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
