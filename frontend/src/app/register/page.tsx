"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

export default function RegisterPage() {
  const { register, error, setError, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
      router.push('/dashboard');
    } catch {
      // Error is handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-[80vh] py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-center text-text-main">
          Create Account
        </h2>
        <p className="mt-2 text-sm text-center text-text-muted">
          Get started with your progression tracker
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="px-4 py-8 shadow-xl glass sm:rounded-2xl sm:px-10 border border-border-subtle">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm font-medium text-red-500 rounded-lg bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-main">
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  placeholder="John Doe"
                  className="block w-full px-4 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-main placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-main">
                Email Address *
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="name@example.com"
                  className="block w-full px-4 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-main placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-main">
                Password *
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="block w-full px-4 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-main placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-main">
                Confirm Password *
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="block w-full px-4 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-main placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white transition-all rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link href="/login" onClick={() => setError(null)} className="font-semibold text-primary hover:text-primary-hover transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

