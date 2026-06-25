"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Database, ShieldAlert, Bot, User, Loader2, Trash2, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_STORAGE_KEY = 'nexora_chat_role';
const HISTORY_KEY = 'nexora_chat_history';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  isStreaming?: boolean;
};

interface ParsedTable {
  headers: string[];
  rows: string[][];
  title?: string;
}

function parseMarkdownTables(text: string): ParsedTable[] {
  if (!text) return [];
  const lines = text.split('\n');
  const tables: ParsedTable[] = [];
  
  let currentTableLines: string[] = [];
  let currentTableStartIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (currentTableLines.length === 0) {
        currentTableStartIdx = i;
      }
      currentTableLines.push(line);
    } else {
      if (currentTableLines.length >= 3) {
        const parsed = processTableLines(currentTableLines, lines, currentTableStartIdx);
        if (parsed) tables.push(parsed);
      }
      currentTableLines = [];
      currentTableStartIdx = -1;
    }
  }
  
  if (currentTableLines.length >= 3) {
    const parsed = processTableLines(currentTableLines, lines, currentTableStartIdx);
    if (parsed) tables.push(parsed);
  }
  
  return tables;
}

function processTableLines(tableLines: string[], allLines: string[], startIdx: number): ParsedTable | null {
  const headers = tableLines[0]
    .split('|')
    .slice(1, -1)
    .map(h => h.trim());
    
  const rows: string[][] = [];
  for (let j = 2; j < tableLines.length; j++) {
    const row = tableLines[j]
      .split('|')
      .slice(1, -1)
      .map(r => r.trim());
    if (row.length === headers.length) {
      rows.push(row);
    }
  }
  
  if (headers.length > 0 && rows.length > 0) {
    let title = "";
    if (startIdx > 0) {
      for (let k = startIdx - 1; k >= Math.max(0, startIdx - 3); k--) {
        const potentialTitle = allLines[k].trim();
        if (potentialTitle.startsWith('#') || (potentialTitle && !potentialTitle.startsWith('|'))) {
          title = potentialTitle.replace(/^#+\s*/, '');
          break;
        }
      }
    }
    return { headers, rows, title: title || undefined };
  }
  return null;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ROLE_STORAGE_KEY) || 'sales';
    }
    return 'sales';
  });
  // Chat messages are NOT persisted across page loads — always start fresh
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(() => Date.now().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTables, setActiveTables] = useState<ParsedTable[]>([]);
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const [showTableModal, setShowTableModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist role selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  }, [role]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save current conversation to localStorage history (upserts by sessionId)
  const saveToHistory = (finalMessages: Message[], currentRole: string) => {
    if (finalMessages.length < 2 || typeof window === 'undefined') return;
    try {
      const firstUserMsg = finalMessages.find(m => m.role === 'user');
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '')
        : 'Conversation';
      const existing: { id: string; title: string; messages: Message[]; role: string; timestamp: number }[] = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || '[]'
      );
      const session = {
        id: sessionId, // stable per page load — upsert so no duplicates
        title,
        messages: finalMessages.filter(m => m.content && !m.isStreaming),
        role: currentRole,
        timestamp: Date.now(),
      };
      // Replace session if same id exists, otherwise prepend
      const filtered = existing.filter(s => s.id !== sessionId);
      const updated = [session, ...filtered].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to history', e);
    }
  };

  const handleClearChat = () => {
    // Save current session to history before clearing
    setMessages(prev => {
      if (prev.length >= 2) saveToHistory(prev, role);
      return [];
    });
  };

  const handleCopy = (id: string, text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }
  };

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

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-Role': role // Passing the simulated role to the backend
        },
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
      
      // Finalize message and auto-save to history
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === agentMsgId ? { ...msg, isStreaming: false } : msg
        );
        const finalMsg = updated.find(msg => msg.id === agentMsgId);
        if (finalMsg) {
          const parsed = parseMarkdownTables(finalMsg.content);
          if (parsed.length > 0) {
            setActiveTables(parsed);
            setSelectedTableIndex(0);
            setShowTableModal(true);
          }
        }
        // Auto-save the whole conversation snapshot to history
        saveToHistory(updated, role);
        return updated;
      });

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === agentMsgId ? { ...msg, content: "Sorry, I encountered an error communicating with the server.", isStreaming: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <header className="glass px-6 py-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Nexora Intelligence
            </h1>
            <p className="text-xs text-gray-400 font-medium tracking-wide">HYBRID RAG + SECURE SQL</p>
          </div>
        </div>

        {/* Role Selector (For Demo Purposes) */}
        <div className="flex items-center gap-4 glass-panel px-4 py-2 text-sm border-white/5">
          <span className="text-gray-400 font-medium">Simulate Role:</span>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent border-none text-white focus:ring-0 outline-none cursor-pointer font-semibold"
          >
            <option value="sales" className="bg-gray-900">Sales Rep</option>
            <option value="support" className="bg-gray-900">Support Agent</option>
            <option value="manager" className="bg-gray-900">Manager</option>
            <option value="admin" className="bg-gray-900">Admin</option>
          </select>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <button
            onClick={handleClearChat}
            title="Clear chat history"
            className="text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Settings className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
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
            <h2 className="text-3xl font-semibold mb-4 text-white/90">How can I help you today?</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              I am connected to the company knowledge base and live database. 
              My 4-layer security ensures you only see the data you have permission to access.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="glass p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5" onClick={() => handleSend("What is the return policy?")}>
                <ShieldAlert className="w-5 h-5 text-purple-400 mb-2" />
                <h3 className="text-sm font-medium text-white/80">Company Policies</h3>
                <p className="text-xs text-gray-500 mt-1">"What is the return policy?"</p>
              </div>
              <div className="glass p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5" onClick={() => handleSend("What were my total sales this month?")}>
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
                    : 'bg-primary/20 border-primary/30'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-purple-400" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
                
                <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-purple-400 mr-1' : 'text-primary ml-1'}`}>
                    {msg.role === 'user' ? 'You' : 'Agentica'}
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
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
                    )}
                  </div>
                  {msg.role === 'agent' && msg.content !== '' && !msg.isStreaming && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-all py-1 px-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 active:scale-95 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="font-medium text-gray-400 hover:text-white">Copy</span>
                          </>
                        )}
                      </button>

                      {parseMarkdownTables(msg.content).length > 0 && (
                        <button
                          onClick={() => {
                            const parsed = parseMarkdownTables(msg.content);
                            if (parsed.length > 0) {
                              setActiveTables(parsed);
                              setSelectedTableIndex(0);
                              setShowTableModal(true);
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-white transition-all py-1.5 px-3 rounded-lg bg-primary/10 hover:bg-primary/25 border border-primary/20 cursor-pointer font-semibold"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>📊 View Structured Data Window</span>
                        </button>
                      )}
                    </div>
                  )}
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
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative glass-panel p-2 pl-4 pr-2 flex items-center gap-3 border border-white/10">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything about products, sales, or company data..."
              className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 py-3 text-sm font-medium disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend(query)}
              disabled={isLoading || !query.trim()}
              className="bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white p-3 rounded-xl transition-all shadow-lg flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Nexora Sales Intelligence Platform • Secured by Row-Level Policies</span>
          </div>
        </div>
      </div>
      {/* Floating Structured Data Window */}
      <AnimatePresence>
        {showTableModal && activeTables.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 flex flex-col gap-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {activeTables[selectedTableIndex]?.title || "Structured Data Explorer"}
                      </h3>
                      <p className="text-xs text-gray-400">Nexora Sales Intelligence Platform</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const table = activeTables[selectedTableIndex];
                        if (!table) return;
                        const headersText = table.headers.join('\t');
                        const rowsText = table.rows.map(row => row.join('\t')).join('\n');
                        const fullText = `${headersText}\n${rowsText}`;
                        navigator.clipboard.writeText(fullText);
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-all py-1.5 px-3 rounded-lg hover:bg-white/5 border border-white/5 active:scale-95 cursor-pointer font-medium"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy TSV (Excel)</span>
                    </button>

                    <button
                      onClick={() => setShowTableModal(false)}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Table selector tabs if there are multiple tables */}
                {activeTables.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 mt-1 scrollbar-thin">
                    {activeTables.map((table, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTableIndex(idx)}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                          selectedTableIndex === idx
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {table.title || `Table ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Body / Table view */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {activeTables[selectedTableIndex] && (
                  <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-white/2 max-h-full">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          {activeTables[selectedTableIndex].headers.map((header, idx) => (
                            <th 
                              key={idx} 
                              className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary select-none whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeTables[selectedTableIndex].rows.map((row, rowIdx) => (
                          <tr 
                            key={rowIdx} 
                            className="hover:bg-white/5 transition-colors group"
                          >
                            {row.map((cell, cellIdx) => (
                              <td 
                                key={cellIdx} 
                                className="px-4 py-3 text-sm text-gray-300 font-medium group-hover:text-white transition-colors max-w-xs truncate"
                                title={cell}
                              >
                                {cell === 'True' || cell === 'true' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                                ) : cell === 'False' || cell === 'false' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Inactive</span>
                                ) : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Showing {activeTables[selectedTableIndex]?.rows.length || 0} rows • {activeTables[selectedTableIndex]?.headers.length || 0} columns
                </span>
                <button
                  onClick={() => setShowTableModal(false)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Dismiss Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
