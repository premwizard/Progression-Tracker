"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export type ViewType = 'home' | 'login' | 'register' | 'dashboard' | 'goals' | 'tasks' | 'assistant' | 'integrations' | 'analytics';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  view: ViewType;
  setView: (view: ViewType) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const DEFAULT_USER: User = {
  id: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
  email: 'owner@progressiontracker.local',
  full_name: 'Personal Owner',
  is_active: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [view, setView] = useState<ViewType>('dashboard');
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const userData = await api.get<User>('/auth/me');
      if (userData) {
        setUser(userData);
      }
    } catch {
      setUser(DEFAULT_USER);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await api.post<{ access_token: string; token_type: string }>(
        '/auth/login',
        { username: email, password },
        true // URL Encoded
      );
      if (response?.access_token) {
        localStorage.setItem('token', response.access_token);
        await fetchCurrentUser();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    setError(null);
    try {
      await api.post<User>('/auth/register', {
        email,
        password,
        full_name: fullName || null,
      });
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(DEFAULT_USER);
    setError(null);
    setView('dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true, // Always authenticated as personal user
        isLoading,
        view,
        setView,
        login,
        register,
        logout,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

