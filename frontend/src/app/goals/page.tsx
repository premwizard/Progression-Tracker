"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
          Goals
        </h1>
        <p className="max-w-md mx-auto mt-4 text-text-muted">
          The legacy Goals module is currently being migrated to the new Next.js App Router and Tailwind styling system. Check back soon!
        </p>
      </motion.div>
    </div>
  );
}
