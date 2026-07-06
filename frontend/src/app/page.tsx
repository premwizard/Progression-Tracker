"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Target, Activity, BrainCircuit, ArrowRight, CheckCircle2,
  Flame, Zap, Globe, Shield, Smartphone, ChevronDown, Star, TrendingUp,
  BarChart3, Calendar, Bell, Sparkles, Users, Check, X, Menu, Play
} from 'lucide-react';

// ── Animation Variants ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 24 } },
};
const stagger = (delay = 0.1) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: delay } },
});

// ── Mini Dashboard Preview ───────────────────────────────────────────
function DashboardPreview() {
  const bars = [65, 45, 80, 35, 90, 60, 75];
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent rounded-3xl blur-3xl" />
      <div className="relative bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        {/* Fake window bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border-subtle bg-bg-base">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <div className="flex-1 mx-4 h-5 rounded-md bg-border-subtle/50 flex items-center px-3">
            <span className="text-[10px] text-text-muted">progression.app/dashboard</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div>
              <div className="h-3 w-24 bg-primary/20 rounded-full mb-2" />
              <div className="h-5 w-48 bg-border-subtle/60 rounded-full" />
            </div>
            {/* Mini ring */}
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-border-subtle/50" />
                <motion.circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={138}
                  className="text-primary"
                  initial={{ strokeDashoffset: 138 }}
                  animate={{ strokeDashoffset: 138 - 138 * 0.54 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text-main">54%</span>
              </div>
            </div>
          </div>
          {/* Progress cards row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: 'React Patterns', pct: 68, color: 'bg-blue-500' },
              { title: 'Marathon', pct: 85, color: 'bg-emerald-500' },
            ].map(card => (
              <div key={card.title} className="p-3 rounded-xl border border-border-subtle bg-bg-base">
                <p className="text-[10px] text-text-muted mb-1">{card.title}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-border-subtle/50">
                    <motion.div className={`h-full rounded-full ${card.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${card.pct}%` }}
                      transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-text-main">{card.pct}%</span>
                </div>
              </div>
            ))}
          </div>
          {/* Mini bar chart */}
          <div className="p-3 rounded-xl border border-border-subtle bg-bg-base">
            <p className="text-[10px] text-text-muted mb-2">This Week</p>
            <div className="flex items-end gap-1 h-10">
              {bars.map((h, i) => (
                <motion.div key={i} className={`flex-1 rounded-sm ${i === 5 ? 'bg-primary' : 'bg-primary/25'}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <span key={i} className={`text-[9px] flex-1 text-center ${i===5?'text-primary font-semibold':'text-text-muted'}`}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Heatmap Preview ──────────────────────────────────────────────────
function HeatmapPreview() {
  const weeks = Array.from({ length: 26 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const r = Math.random();
      if (w > 22) return r > 0.25 ? Math.ceil(r * 4) : 0;
      if (w > 16) return r > 0.4 ? Math.ceil(r * 3) : 0;
      return r > 0.6 ? Math.ceil(r * 2) : 0;
    })
  );
  const colors = ['bg-border-subtle/20', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'];
  return (
    <div className="flex gap-0.5 overflow-hidden">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-0.5">
          {week.map((v, di) => (
            <div key={di} className={`w-2.5 h-2.5 rounded-sm ${colors[v]}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── AI Chat Preview ──────────────────────────────────────────────────
function AIChatPreview() {
  const msgs = [
    { role: 'user', text: "I missed 2 runs this week. Help me recover." },
    { role: 'ai', text: "No worries — your 22-day base is solid. Start with an easy 5K tomorrow, then get back to your training plan on Thursday. Missing 2 days won't derail your marathon goal. 💪" },
  ];
  return (
    <div className="space-y-3">
      {msgs.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
          whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          transition={{ delay: i * 0.3 }}
          className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'ai' ? 'bg-gradient-to-br from-primary to-accent' : 'bg-primary/20'}`}>
            {m.role === 'ai' ? <Sparkles className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary text-white' : 'bg-bg-base border border-border-subtle text-text-main'}`}>
            {m.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── FAQ Item ─────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-border-subtle/20 transition-colors"
      >
        <span className="text-sm font-medium text-text-main">{q}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted flex-shrink-0 ml-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-text-muted leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FEATURES = [
  { icon: <Target className="w-6 h-6" />, title: 'Goal Tracking', desc: 'Set ambitious goals with milestones. Track real-time progress with automatic completion calculation.' },
  { icon: <Activity className="w-6 h-6" />, title: 'Data Analytics', desc: 'Visualize your growth over days, weeks, and months with beautiful, interactive charts and heatmaps.' },
  { icon: <BrainCircuit className="w-6 h-6" />, title: 'AI Coach', desc: 'Your personal AI coach analyzes your patterns and delivers personalized, context-aware recommendations.' },
  { icon: <Flame className="w-6 h-6" />, title: 'Streak Engine', desc: 'Never break the chain. Daily streak tracking with smart reminders that respect your schedule.' },
  { icon: <Globe className="w-6 h-6" />, title: 'Integrations', desc: 'Connect GitHub, Notion, Google Calendar, and more. Your progress, synced everywhere.' },
  { icon: <Smartphone className="w-6 h-6" />, title: 'Mobile App', desc: 'Native iOS and Android apps. Full offline support — track progress anywhere, anytime.' },
];

const PRICING = [
  {
    name: 'Free', price: '$0', period: '/month', desc: 'Perfect for getting started.',
    features: ['3 active goals', '5 tasks per goal', 'Basic analytics', '7-day history', 'Mobile app'],
    cta: 'Get Started', highlight: false,
  },
  {
    name: 'Pro', price: '$12', period: '/month', desc: 'For serious achievers.',
    features: ['Unlimited goals', 'Unlimited tasks', 'Advanced analytics', 'Full history', 'AI Coach', 'Integrations', 'Priority support'],
    cta: 'Start Free Trial', highlight: true,
  },
  {
    name: 'Team', price: '$29', period: '/month', desc: 'For teams that ship.',
    features: ['Everything in Pro', 'Up to 10 members', 'Team analytics', 'Shared goals', 'Admin dashboard', 'SSO', 'Dedicated support'],
    cta: 'Contact Sales', highlight: false,
  },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Software Engineer @ Google', avatar: 'SC', text: "Progression Tracker completely changed how I approach skill development. The AI coach caught patterns I'd been missing for months." },
  { name: 'Marcus Reid', role: 'Marathon Runner & PM', avatar: 'MR', text: "The streak system is addictive in the best way possible. 87-day streak on my marathon training and counting. This app is why I qualified." },
  { name: 'Priya Sharma', role: 'Language Learner', avatar: 'PS', text: "I've tried every app out there. Nothing comes close to the analytics depth here. I can finally see what's working and what isn't." },
];

const FAQS = [
  { q: 'Is Progression Tracker free to use?', a: 'Yes! The Free plan gives you 3 goals, 5 tasks per goal, and basic analytics — no credit card required. You can upgrade to Pro at any time.' },
  { q: 'How does the AI Coach work?', a: 'The AI Coach reads your goal structure, task history, streaks, and patterns to provide personalized recommendations. It improves over time as it learns your habits and preferences.' },
  { q: 'Can I import data from other apps?', a: 'We support imports from Notion, Todoist, and CSV. Our integrations team is continuously adding new sources.' },
  { q: 'Is my data private?', a: 'Absolutely. Your data is encrypted at rest and in transit. We never sell data to third parties. You can export or delete your data at any time.' },
  { q: 'Does the mobile app work offline?', a: 'Yes. The mobile app syncs in the background and works fully offline. Changes sync automatically when you reconnect.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel at any time from your account settings. You keep Pro features until the end of your billing period.' },
];

// ── Main Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* SEO */}
      <title>Progression Tracker — AI-Powered Goal & Habit Tracking</title>

      <div className="overflow-x-hidden">

        {/* ── HERO ── */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 py-24 text-center overflow-hidden">
          {/* Background radial glow */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-60 -right-40 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
          </div>

          <motion.div variants={stagger(0.15)} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <motion.div variants={fadeUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered · v2.0 Now Live
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-text-main leading-[1.05]">
              Master every goal.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-accent">
                Outpace yourself.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={fadeUp} className="max-w-2xl mx-auto text-lg sm:text-xl text-text-muted leading-relaxed">
              The productivity platform that tracks your goals, streaks, and habits — powered by an AI coach that actually knows your patterns.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
              >
                Start for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#demo"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border border-border-subtle text-text-main hover:bg-border-subtle/30 transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                See how it works
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 text-xs text-text-muted pt-2">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />No credit card</span>
              <span className="w-1 h-1 rounded-full bg-border-subtle" />
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />Setup in 60 seconds</span>
              <span className="w-1 h-1 rounded-full bg-border-subtle" />
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />2,400+ users</span>
            </motion.div>
          </motion.div>
        </section>

        {/* ── PRODUCT PREVIEW ── */}
        <section id="demo" className="px-4 py-20 border-t border-border-subtle">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-main">Everything in one place</h2>
              <p className="mt-3 text-text-muted">Your goals, progress, analytics, and AI coach — all connected.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="px-4 py-24 border-t border-border-subtle bg-bg-surface/30">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-16">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">Features</span>
                <h2 className="mt-3 text-4xl font-bold text-text-main">Built for serious achievers</h2>
                <p className="mt-4 max-w-xl mx-auto text-text-muted">Every feature is designed to reduce friction between you and your goals.</p>
              </motion.div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(f => (
                  <motion.div key={f.title} variants={fadeUp}
                    className="group p-6 glass rounded-2xl border border-border-subtle hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default"
                  >
                    <div className="w-11 h-11 mb-5 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                      {f.icon}
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-text-main">{f.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── AI COACH SECTION ── */}
        <section className="px-4 py-24 border-t border-border-subtle">
          <div className="max-w-5xl mx-auto grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">AI Coach</span>
              <h2 className="mt-3 text-4xl font-bold text-text-main leading-tight">
                Your coach remembers<br />everything.
              </h2>
              <p className="mt-5 text-text-muted leading-relaxed">
                Unlike generic chatbots, your AI Coach has context about every goal, every streak, and every task. It gives advice that's actually relevant to <em>your</em> life — not generic tips.
              </p>
              <ul className="mt-8 space-y-3">
                {['Pattern recognition across all your goals', 'Personalized weekly review & reflection', 'Smart task scheduling based on your history', 'Accountability nudges that respect your pace'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-text-main">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 mt-8 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
                Try AI Coach free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-6 glass rounded-2xl border border-border-subtle"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-text-main">AI Coach</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 rounded-full">Live</span>
              </div>
              <AIChatPreview />
            </motion.div>
          </div>
        </section>

        {/* ── HEATMAP SECTION ── */}
        <section className="px-4 py-24 border-t border-border-subtle bg-bg-surface/30">
          <div className="max-w-5xl mx-auto grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-6 glass rounded-2xl border border-border-subtle order-2 lg:order-1"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">6-Month Activity</p>
              <HeatmapPreview />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-text-muted">Jan 2026</span>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>Less</span>
                  <div className="flex gap-0.5">
                    {['bg-border-subtle/30', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'].map((c, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                    ))}
                  </div>
                  <span>More</span>
                </div>
                <span className="text-xs text-text-muted">Jun 2026</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Consistency Tracking</span>
              <h2 className="mt-3 text-4xl font-bold text-text-main leading-tight">
                See your streak.<br />Feel the momentum.
              </h2>
              <p className="mt-5 text-text-muted leading-relaxed">
                The GitHub-style activity heatmap makes your consistency visible. Watch your calendar fill with color as you build momentum day by day.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { value: '24 days', label: 'Current streak' },
                  { value: '87%', label: 'Consistency rate' },
                  { value: '312', label: 'Total sessions' },
                  { value: '4 goals', label: 'Active tracks' },
                ].map(stat => (
                  <div key={stat.label} className="p-4 rounded-xl border border-border-subtle glass">
                    <p className="text-xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="px-4 py-24 border-t border-border-subtle">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <div className="flex justify-center gap-0.5 mb-3">
                  {Array(5).fill(0).map((_, i) => <Star key={i} className="w-5 h-5 text-accent fill-accent" />)}
                </div>
                <h2 className="text-3xl font-bold text-text-main">Loved by achievers</h2>
                <p className="mt-3 text-text-muted">Join 2,400+ people building momentum every day.</p>
              </motion.div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {TESTIMONIALS.map(t => (
                  <motion.div key={t.name} variants={fadeUp}
                    className="p-6 glass rounded-2xl border border-border-subtle hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-main">{t.name}</p>
                        <p className="text-xs text-text-muted">{t.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">"{t.text}"</p>
                    <div className="flex gap-0.5 mt-4">
                      {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="px-4 py-24 border-t border-border-subtle bg-bg-surface/30">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</span>
                <h2 className="mt-3 text-4xl font-bold text-text-main">Simple, transparent pricing</h2>
                <p className="mt-3 text-text-muted">Start free. Upgrade when you're ready.</p>
              </motion.div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-center">
                {PRICING.map(plan => (
                  <motion.div key={plan.name} variants={fadeUp}
                    className={`relative p-6 rounded-2xl border transition-all ${plan.highlight ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/25 scale-105' : 'glass border-border-subtle'}`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-accent rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-white/80' : 'text-text-muted'}`}>{plan.name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-text-main'}`}>{plan.price}</span>
                      <span className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-text-muted'}`}>{plan.period}</span>
                    </div>
                    <p className={`text-xs mb-5 ${plan.highlight ? 'text-white/70' : 'text-text-muted'}`}>{plan.desc}</p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                          <span className={plan.highlight ? 'text-white/90' : 'text-text-main'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/register"
                      className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${plan.highlight ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20'}`}
                    >
                      {plan.cta}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 py-24 border-t border-border-subtle">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-3xl font-bold text-text-main">Frequently asked</h2>
              <p className="mt-3 text-text-muted">Everything you need to know about Progression Tracker.</p>
            </motion.div>
            <div className="space-y-3">
              {FAQS.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-4 py-24 border-t border-border-subtle">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-bg-surface to-accent/10 border border-primary/20 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/15 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-4xl font-extrabold text-text-main">Ready to level up?</h2>
              <p className="mt-4 text-lg text-text-muted max-w-xl mx-auto">
                Join thousands of achievers tracking goals and building momentum — starting today, for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link href="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover shadow-xl shadow-primary/30 transition-all"
                >
                  Start for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-border-subtle text-text-main hover:bg-border-subtle/30 transition-all"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-border-subtle px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-5 mb-10">
              {/* Brand */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-base text-text-main">Progression</span>
                </div>
                <p className="text-sm text-text-muted max-w-xs">
                  The AI-powered platform for serious achievers. Track goals, build streaks, and outpace yourself.
                </p>
              </div>
              {/* Links */}
              {[
                { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
                { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
              ].map(col => (
                <div key={col.title}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" className="text-sm text-text-muted hover:text-text-main transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border-subtle gap-4">
              <p className="text-xs text-text-muted">© 2026 Progression Tracker. All rights reserved.</p>
              <p className="text-xs text-text-muted">Made with <span className="text-primary">♥</span> for achievers worldwide.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
