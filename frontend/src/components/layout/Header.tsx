"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Bell, Rocket, LayoutDashboard, Target, CheckSquare, BrainCircuit,
  Activity, LogOut, Search, Menu, X, Check, Trash2, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CommandPalette } from '../ui/CommandPalette';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Goals',     href: '/goals',     icon: Target },
  { name: 'Tasks',     href: '/tasks',     icon: CheckSquare },
  { name: 'AI Planner',href: '/assistant', icon: BrainCircuit },
  { name: 'Analytics', href: '/analytics', icon: Activity },
];

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications]   = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu]  = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isScrolled, setIsScrolled]         = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const pathname   = usePathname();

  // Consecutive network-failure counter for backoff
  const failCount   = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Keyboard shortcut ⌘K / Ctrl+K ──────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Close mobile menu on route change ───────────────────────────
  useEffect(() => { setShowMobileMenu(false); }, [pathname]);

  // ── Scroll shadow ────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ── Click-outside for notification dropdown ──────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Notification polling with backoff ────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get<NotificationItem[]>('/notifications');
      setNotifications(data ?? []);
      failCount.current = 0;
    } catch (err) {
      if (err instanceof TypeError) {
        failCount.current += 1;
        if (failCount.current >= 3 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      console.warn('[Notifications] API error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    failCount.current = 0;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <>
      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
      </AnimatePresence>

      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-bg-base/85 backdrop-blur-md border-b border-border-subtle shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Rocket className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight text-text-main">Progression</span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                {NAV_LINKS.map(item => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-border-subtle/50 hover:text-text-main'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* ⌘K Button */}
                  <button onClick={() => setShowCommandPalette(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted border border-border-subtle rounded-lg hover:border-primary/30 hover:text-text-main transition-all"
                    aria-label="Open command palette"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                    <kbd className="text-[10px] opacity-60">⌘K</kbd>
                  </button>

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="relative p-2 text-text-muted hover:text-text-main transition-colors rounded-lg hover:bg-border-subtle/50"
                      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-bg-base" />
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    <AnimatePresence>
                      {showNotifDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className="absolute right-0 top-full mt-2 w-80 bg-bg-surface border border-border-subtle rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-50"
                        >
                          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                            <h3 className="text-sm font-semibold text-text-main">Notifications</h3>
                            {unreadCount > 0 && (
                              <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                            )}
                          </div>
                          <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="py-10 text-center text-sm text-text-muted">
                                <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                                No notifications yet
                              </div>
                            ) : (
                              notifications.slice(0, 8).map(n => (
                                <button key={n.id} onClick={() => markRead(n.id)}
                                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-border-subtle/30 transition-colors border-b border-border-subtle/50 last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                                >
                                  {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                                  {n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-border-subtle flex-shrink-0" />}
                                  <p className="text-xs text-text-main leading-relaxed">{n.message}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="hidden sm:block h-6 w-px bg-border-subtle mx-1" />

                  {/* User Avatar + Logout */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold text-sm select-none">
                      {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <button onClick={logout}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile hamburger */}
                  <button onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden p-2 text-text-muted hover:text-text-main transition-colors rounded-lg hover:bg-border-subtle/50"
                    aria-label="Open menu"
                  >
                    {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                <Link href="/login"
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && isAuthenticated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-border-subtle bg-bg-base/95 backdrop-blur-md"
            >
              <div className="px-4 py-4 space-y-1">
                {/* Search */}
                <button onClick={() => { setShowCommandPalette(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-text-muted hover:bg-border-subtle/50 hover:text-text-main transition-colors"
                >
                  <Search className="w-4 h-4" /> Search & Commands
                </button>

                {NAV_LINKS.map(item => {
                  const isActive = pathname?.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-border-subtle/50 hover:text-text-main'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                      <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-border-subtle">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-main">{user?.full_name || 'User'}</p>
                        <p className="text-[10px] text-text-muted">{user?.email}</p>
                      </div>
                    </div>
                    <button onClick={logout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" aria-label="Sign out">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
