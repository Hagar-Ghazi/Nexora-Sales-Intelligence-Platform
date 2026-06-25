"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, MessageSquare, ChevronDown, ChevronUp, Bot, User, Clock } from 'lucide-react';

const HISTORY_KEY = 'nexora_chat_history';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  role: string;
  timestamp: number;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatSession[];
          setSessions(parsed.sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    }
  }, []);

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
  };

  const clearAll = () => {
    setSessions([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      sales: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      manager: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      support: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  if (!isMounted) return null;

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="glass px-6 py-4 flex items-center justify-between z-10 relative border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
            <History className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Chat History
            </h1>
            <p className="text-xs text-gray-400 font-medium tracking-wide">ALL PAST CONVERSATIONS</p>
          </div>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-6 mt-24 text-center"
            >
              <div className="bg-purple-500/10 p-6 rounded-3xl border border-purple-500/20">
                <MessageSquare className="w-14 h-14 text-purple-400/50" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white/70 mb-3">No Conversations Yet</h2>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                  Your past chat sessions will appear here. Start a conversation in Agent Chat to create history.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-6">
                {sessions.length} conversation{sessions.length !== 1 ? 's' : ''} found
              </p>
              <AnimatePresence>
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass rounded-2xl border border-white/5 overflow-hidden"
                  >
                    {/* Session Header */}
                    <div className="px-5 py-4 flex items-center justify-between gap-4">
                      <button
                        onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                        className="flex-1 flex items-center gap-4 text-left min-w-0"
                      >
                        <div className="bg-primary/20 p-2 rounded-xl border border-primary/30 shrink-0">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{session.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatDate(session.timestamp)}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${getRoleBadgeColor(session.role)}`}>
                              {session.role}
                            </span>
                            <span className="text-xs text-gray-600">
                              {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete this conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                          {expandedId === session.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Expanded Messages */}
                    <AnimatePresence>
                      {expandedId === session.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-white/5"
                        >
                          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                            {session.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                              >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                                  msg.role === 'user'
                                    ? 'bg-purple-500/20 border-purple-500/30'
                                    : 'bg-primary/20 border-primary/30'
                                }`}>
                                  {msg.role === 'user'
                                    ? <User className="w-3.5 h-3.5 text-purple-400" />
                                    : <Bot className="w-3.5 h-3.5 text-primary" />
                                  }
                                </div>
                                <div className={`max-w-[80%] glass px-4 py-3 rounded-xl text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border border-white/5 ${
                                  msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
