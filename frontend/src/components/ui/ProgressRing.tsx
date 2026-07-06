"use client";

import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = 'var(--color-primary)',
  className = '',
}: ProgressRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Cap progress between 0 and 100
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="var(--color-border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (safeProgress / 100) * circumference }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      
      {/* Inner Content (Percentage) */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-xl font-bold tracking-tight text-text-main">
          {Math.round(safeProgress)}%
        </span>
      </div>
    </div>
  );
}
