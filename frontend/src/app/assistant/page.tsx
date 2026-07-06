"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Sparkles, User, Loader2, RotateCcw, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Help me plan my React learning schedule for next week',
  'I haven\'t run in 3 days, how do I get back on track?',
  'Suggest daily habits to improve my French in 30 minutes/day',
  'What system design topics should I prioritize for interviews?',
];

const MOCK_RESPONSES: Record<string, string> = {
  default: `Great question! Based on your current progress and streaks, here's what I recommend:

**Immediate focus areas:**
- You're 68% through React Advanced Patterns — finishing strong this week will unlock the compound components section
- Your Marathon Training streak of 24 days is impressive. Protect it by scheduling tomorrow's run now
- French A2 has a 0-day streak — even 10 minutes today will restart the momentum

**This week's priority order:**
1. 🏃 Run (protect the 24-day streak — highest priority)
2. ⚛️ React: 1 concept/day (consistent beats intense)
3. 🇫🇷 French: 15 min vocab before bed

Want me to create a detailed daily schedule?`,
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary/20' : 'bg-gradient-to-br from-primary to-accent'}`}>
        {isUser
          ? <User className="w-4 h-4 text-primary" />
          : <Sparkles className="w-4 h-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-primary text-white rounded-tr-sm'
          : 'glass border border-border-subtle text-text-main rounded-tl-sm'
      }`}>
        {message.content}
      </div>
    </motion.div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hi! I'm your AI planning assistant. I can help you build schedules, analyze your progress patterns, suggest habits, and keep you accountable. What would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    setIsTyping(false);
    const reply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: MOCK_RESPONSES.default,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, reply]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "Chat cleared. How can I help you today?",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="max-w-3xl px-4 py-12 mx-auto flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-primary mb-2">
              <BrainCircuit className="w-5 h-5" />
              <span className="font-semibold tracking-wider uppercase text-sm">AI Planner</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-main">Your AI Coach</h1>
            <p className="mt-1 text-sm text-text-muted">Powered by context from all your goals & tasks</p>
          </div>
          <button onClick={clearChat} className="p-2 text-text-muted hover:text-text-main transition-colors rounded-lg hover:bg-border-subtle/50" title="Clear chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto glass border border-border-subtle rounded-2xl p-4 space-y-4 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-accent flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="glass border border-border-subtle rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="flex-shrink-0 mt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2">
            <Lightbulb className="w-3.5 h-3.5" /> Suggestions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left text-xs px-3 py-2.5 rounded-xl border border-border-subtle text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 mt-4">
        <div className="flex gap-3 items-end p-3 glass border border-border-subtle rounded-2xl focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI coach anything... (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-text-main placeholder-text-muted focus:outline-none leading-relaxed"
            style={{ maxHeight: '120px' }}
            onInput={e => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 p-2 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md hover:shadow-primary/20"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
}

