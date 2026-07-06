import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './Header.css';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, view, setView } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (isAuthenticated) {
      try {
        const data = await api.get<NotificationItem[]>('/notifications');
        setNotifications(data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Periodically sync alerts every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, view]);

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id: string, read: boolean) => {
    if (read) return;
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
              className={`nav-link-btn ${view === 'tasks' ? 'active' : ''}`}
              onClick={() => setView('tasks')}
            >
              Tasks
            </button>
            <button 
              className={`nav-link-btn ${view === 'assistant' ? 'active' : ''}`}
              onClick={() => setView('assistant')}
            >
              AI Planner
            </button>
            <button 
              className={`nav-link-btn ${view === 'integrations' ? 'active' : ''}`}
              onClick={() => setView('integrations')}
            >
              Connect
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
          {isAuthenticated && (
            <div className="notification-bell-container" ref={dropdownRef} style={{ marginRight: '1rem' }}>
              <button className="bell-btn" onClick={() => setShowDropdown(prev => !prev)}>
                🔔
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
              </button>
              
              {showDropdown && (
                <div className="notifications-dropdown">
                  <div className="notif-dropdown-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="btn-link" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="notif-list-container">
                    {notifications.length === 0 ? (
                      <div className="notif-empty-state">No active notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notif-item ${notif.read ? '' : 'unread'}`}
                          onClick={() => handleMarkAsRead(notif.id, notif.read)}
                        >
                          <span className={`notif-bullet ${notif.type}`} />
                          <div className="notif-body">
                            <span className="notif-text">{notif.message}</span>
                            <span className="notif-time">
                              {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
export default Header;
