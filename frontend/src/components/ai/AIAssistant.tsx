import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AIAssistant.css';

interface SuggestedTask {
  title: string;
}

interface SuggestedGoal {
  title: string;
  description: string | null;
  tasks: SuggestedTask[];
}

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  suggestedGoals?: SuggestedGoal[] | null;
}

export const AIAssistant: React.FC = () => {
  const { setView } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: "Hello! I am your AI Progression Coach. Let's plan your next goals together! Tell me what you want to achieve (e.g. 'I want to learn Python programming', 'I need a fitness routine', 'Structure a Dart and Flutter roadmap')."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [submittingGoalId, setSubmittingGoalId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');

    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // 2. Call AI Endpoint
      const response = await api.post<{ response: string; suggested_goals: SuggestedGoal[] | null }>(
        '/ai/chat',
        { message: userText }
      );

      // 3. Add AI Coach Response
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'coach',
        text: response.response,
        suggestedGoals: response.suggested_goals
      };
      setMessages(prev => [...prev, coachMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'coach',
        text: "I'm sorry, I encountered an issue processing your request. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImplementGoal = async (goal: SuggestedGoal) => {
    setSubmittingGoalId(goal.title);
    try {
      await api.post('/goals', {
        title: goal.title,
        description: goal.description,
        tasks: goal.tasks.map(t => ({ title: t.title, description: null, status: 'todo' }))
      });
      // Redirect to goals board
      setView('goals');
    } catch {
      alert('Failed to implement suggested goal plan.');
    } finally {
      setSubmittingGoalId(null);
    }
  };

  return (
    <div className="ai-layout">
      <div className="ai-header">
        <h2>Progression AI Coach</h2>
        <p>Consult with the AI agent to plan goals, organize tasks, and inspect insights.</p>
      </div>

      <div className="chat-container-card">
        <div className="chat-history">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
              <div className={`chat-bubble ${msg.sender}`}>
                <p>{msg.text}</p>
                
                {/* Proposed Goals Blueprints */}
                {msg.suggestedGoals && msg.suggestedGoals.map((goal, idx) => (
                  <div key={idx} className="ai-suggested-goal-card">
                    <h4>🎯 {goal.title}</h4>
                    {goal.description && <p>{goal.description}</p>}
                    
                    <div className="ai-suggested-tasks-list">
                      {goal.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="ai-suggested-task-item">
                          <span>◽</span>
                          <span>{task.title}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-sm"
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                      onClick={() => handleImplementGoal(goal)}
                      disabled={submittingGoalId !== null}
                    >
                      {submittingGoalId === goal.title ? 'Implementing...' : 'Implement Goal Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble-row coach">
              <div className="chat-bubble assistant">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" className="btn" disabled={isTyping || !inputText.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
export default AIAssistant;
