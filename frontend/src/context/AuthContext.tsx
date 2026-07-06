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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [view, setView] = useState<ViewType>('home');
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const userData = await api.get<User>('/auth/me');
      setUser(userData);
      setView('dashboard');
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setView('home');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
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
      localStorage.setItem('token', response.access_token);
      await fetchCurrentUser();
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
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
      // Auto login after registration
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    setView('home');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
