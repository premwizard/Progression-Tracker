"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, Target, Activity, BrainCircuit, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col min-h-[90vh]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="max-w-4xl mx-auto space-y-8"
        >
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center px-4 py-2 space-x-2 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              <Rocket className="w-4 h-4" />
              <span>Progression Tracker v2.0 is live</span>
            </div>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-text-main">
            Master your potential, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              one step at a time.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="max-w-2xl mx-auto text-lg sm:text-xl text-text-muted">
            The ultimate tool to track skills, habits, and project milestones. Visualize your growth, maintain your streaks, and achieve your goals with data-driven insights.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center pt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
            >
              Start Tracking Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold transition-all border shadow-sm rounded-xl text-text-main bg-bg-base border-border-subtle hover:bg-border-subtle/50 active:scale-[0.98]"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Highlight Section */}
      <section className="px-4 py-20 bg-bg-base/50 sm:px-6 lg:px-8 border-t border-border-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                title: 'Goal Tracking',
                description: 'Set ambitious goals and break them down into actionable tasks.',
                icon: Target,
              },
              {
                title: 'Data-Driven Analytics',
                description: 'Visualize your progress over time with beautiful, insightful charts.',
                icon: Activity,
              },
              {
                title: 'AI Assistant',
                description: 'Get personalized insights and planning help from your AI coach.',
                icon: BrainCircuit,
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 transition-all border shadow-sm glass-panel rounded-2xl border-border-subtle hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-xl bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-text-main">{feature.title}</h3>
                  <p className="text-text-muted">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
