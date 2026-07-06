"use client";

import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, TrendingUp, CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ProgressRing } from '../../../components/ui/ProgressRing';

const CHART_DATA = [
  { name: 'Week 1', progress: 10 },
  { name: 'Week 2', progress: 25 },
  { name: 'Week 3', progress: 32 },
  { name: 'Week 4', progress: 45 },
  { name: 'Week 5', progress: 58 },
  { name: 'Week 6', progress: 68 },
];

const TIMELINE = [
  {
    id: 1,
    title: 'Completed Section 4: Custom Hooks',
    date: 'Today, 2:45 PM',
    type: 'milestone',
    notes: 'Finally understood how to extract complex state logic into reusable hooks. Need to practice useReducer next.',
  },
  {
    id: 2,
    title: 'Added 5% Progress',
    date: 'Yesterday, 10:15 AM',
    type: 'update',
    notes: '',
  },
  {
    id: 3,
    title: 'Completed Section 3: Context API',
    date: '3 days ago',
    type: 'milestone',
    notes: 'Context is great for theme and auth, but not for high-frequency updates.',
  }
];

export default function ItemDetailPage() {
  // const params = useParams();
  
  // In a real app, fetch data based on ID. We use mock data here.
  const title = "React Advanced Patterns";
  const category = "Engineering";
  const progress = 68;

  return (
    <div className="max-w-5xl px-4 py-12 mx-auto space-y-10">
      {/* Navigation & Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/" className="inline-flex items-center text-sm font-medium transition-colors text-text-muted hover:text-primary mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-border-subtle/50 text-text-muted mb-4">
              {category}
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-text-main md:text-5xl mb-4">
              {title}
            </h1>
            <p className="text-lg text-text-muted max-w-2xl">
              Mastering modern React patterns including custom hooks, context, render props, and compound components to build scalable applications.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <ProgressRing progress={progress} size={120} strokeWidth={12} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Analytics & Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 glass rounded-3xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-text-main">
                <TrendingUp className="w-5 h-5 text-primary" />
                Progress Trend
              </h2>
              <select className="bg-bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-sm font-medium text-text-main outline-none focus:border-primary transition-colors">
                <option>Last 6 Weeks</option>
                <option>Last 3 Months</option>
                <option>All Time</option>
              </select>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-bg-surface)', 
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }} 
                    itemStyle={{ color: 'var(--color-text-main)', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorProgress)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Timeline Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-text-main">Activity History</h2>
            <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[23px] before:w-[2px] before:bg-border-subtle">
              {TIMELINE.map((item) => (
                <div key={item.id} className="relative pl-8">
                  {/* Timeline Node */}
                  <div className={`absolute left-0 w-4 h-4 rounded-full border-4 border-bg-base top-1 ${
                    item.type === 'milestone' ? 'bg-primary' : 'bg-border-subtle'
                  }`} />
                  
                  <div className="p-5 glass rounded-2xl">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-text-main flex items-center gap-2">
                        {item.type === 'milestone' ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-text-muted" />}
                        {item.title}
                      </h3>
                      <span className="text-xs font-medium text-text-muted">{item.date}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-text-muted mt-3 flex items-start gap-2 bg-bg-base/50 p-3 rounded-xl border border-border-subtle">
                        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Quick Actions & Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <div className="p-6 space-y-4 glass rounded-3xl">
            <h3 className="font-semibold text-text-main mb-4">Update Progress</h3>
            <button className="w-full py-3 text-sm font-semibold text-white transition-all rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0">
              Log Session
            </button>
            <button className="w-full py-3 text-sm font-semibold transition-all border rounded-xl border-border-subtle text-text-main hover:bg-border-subtle/30">
              Add Milestone
            </button>
          </div>

          {/* Stats Summary */}
          <div className="p-6 glass rounded-3xl space-y-6">
            <h3 className="font-semibold text-text-main">Target Overview</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <Target className="w-4 h-4" /> Goal Target
                </span>
                <span className="font-semibold text-text-main">100% Completion</span>
              </div>
              
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time Invested
                </span>
                <span className="font-semibold text-text-main">42 Hours</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Current Streak
                </span>
                <span className="font-semibold text-accent">12 Days 🔥</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
