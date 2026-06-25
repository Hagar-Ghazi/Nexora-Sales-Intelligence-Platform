"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Database, ShieldAlert, Bot, User, Loader2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  isStreaming?: boolean;
};

export default function Home() {
  const { user, token, loading } = useAuth();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Securing session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via AuthContext
  }

  const handleSend = async (textToSubmit: string = query) => {
    if (!textToSubmit.trim() || isLoading) return;
    
    const userMsgId = Date.now().toString();
    const agentMsgId = (Date.now() + 1).toString();

    // Add user message
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: textToSubmit }]);
    setQuery('');
    setIsLoading(true);

    try {
      // Create a placeholder for the agent's response
      setMessages(prev => [...prev, { id: agentMsgId, role: 'agent', content: '', isStreaming: true }]);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: textToSubmit, conversation_id: "default" })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let agentMessage = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'token') {
                  agentMessage += data.content;
                  setMessages(prev => prev.map(msg => 
                    msg.id === agentMsgId ? { ...msg, content: agentMessage } : msg
                  ));
                } else if (data.type === 'error') {
                   agentMessage += `\n\nError: ${data.message}`;
                   setMessages(prev => prev.map(msg => 
                    msg.id === agentMsgId ? { ...msg, content: agentMessage } : msg
                  ));
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
      
      // Finalize message
      setMessages(prev => prev.map(msg => 
        msg.id === agentMsgId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === agentMsgId ? { ...msg, content: "Sorry, I encountered an error communicating with the server.", isStreaming: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Get color styling for the user's role badge
  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'manager':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'sales':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'support':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B0F19] text-white">
      {/* Top Navigation */}
      <header className="glass px-6 py-4 flex items-center justify-between z-10 relative border-b border-white/5 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
            <Bot className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Nexora Intelligence
            </h1>
            <p className="text-xs text-gray-400 font-medium tracking-wide">HYBRID RAG + SECURE SQL</p>
          </div>
        </div>

        {/* User Identity Info & Notifications (replaces mock role simulation) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-white">{user.full_name}</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
              {user.role}
            </span>
          </div>

          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative scroll-smooth">
        
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center mt-12 mb-8"
          >
            <h2 className="text-3xl font-semibold mb-4 text-white/90">How can I help you today, {user.full_name.split(' ')[0]}?</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              I am connected to the company knowledge base and live database. 
              My 4-layer security ensures you only see the data you have permission to access.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="glass p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5 bg-white/5" onClick={() => handleSend("What is the return policy?")}>
                <ShieldAlert className="w-5 h-5 text-purple-400 mb-2" />
                <h3 className="text-sm font-medium text-white/80">Company Policies</h3>
                <p className="text-xs text-gray-500 mt-1">"What is the return policy?"</p>
              </div>
              <div className="glass p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5 bg-white/5" onClick={() => handleSend("What were my total sales this month?")}>
                <Database className="w-5 h-5 text-blue-400 mb-2" />
                <h3 className="text-sm font-medium text-white/80">Live Data</h3>
                <p className="text-xs text-gray-500 mt-1">"What were my total sales?"</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-6 pb-32">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 ${
                  msg.role === 'user' 
                    ? 'bg-purple-500/20 border-purple-500/30' 
                    : 'bg-blue-600/20 border-blue-500/30'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-purple-400" /> : <Bot className="w-4 h-4 text-blue-500" />}
                </div>
                
                <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-purple-400 mr-1' : 'text-blue-500 ml-1'}`}>
                    {msg.role === 'user' ? user.full_name : 'Nexora'}
                  </span>
                  <div className={`glass-panel p-4 text-sm text-gray-200 leading-relaxed border-white/5 shadow-none whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-white/5 rounded-tr-sm' : 'rounded-tl-sm'
                  }`}>
                    {msg.content === '' && msg.isStreaming ? (
                      <span className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                      </span>
                    ) : (
                      msg.content
                    )}
                    {msg.isStreaming && msg.content !== '' && (
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pb-6 pt-12 px-6">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative glass-panel p-2 pl-4 pr-2 flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-xl">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything about products, sales, or company data..."
              className="flex-1 bg-transparent border-none text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 py-3 text-sm font-medium disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend(query)}
              disabled={isLoading || !query.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white p-3 rounded-xl transition-all shadow-lg flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Nexora Sales Intelligence Platform • Secured by Row-Level Policies</span>
          </div>
        </div>
      </div>
    </main>
  );
}
