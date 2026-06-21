"use client";

import { useState } from 'react';
import { Send, Settings, User, Database, ShieldAlert, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('sales');

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
          <Settings className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
        
        {/* Welcome Message */}
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
            <div className="glass p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5" onClick={() => setQuery("What is the return policy?")}>
              <ShieldAlert className="w-5 h-5 text-purple-400 mb-2" />
              <h3 className="text-sm font-medium text-white/80">Company Policies</h3>
              <p className="text-xs text-gray-500 mt-1">"What is the return policy?"</p>
            </div>
            <div className="glass p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5" onClick={() => setQuery("What were my total sales this month?")}>
              <Database className="w-5 h-5 text-blue-400 mb-2" />
              <h3 className="text-sm font-medium text-white/80">Live Data</h3>
              <p className="text-xs text-gray-500 mt-1">"What were my total sales?"</p>
            </div>
          </div>
        </motion.div>

        {/* Empty State / Chat Messages will go here */}
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-6 pb-32">
          {/* Example Agent Message */}
          <motion.div className="flex gap-4 max-w-[85%]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 mt-1">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-primary ml-1">Agent</span>
              <div className="glass-panel p-4 text-sm text-gray-200 leading-relaxed border-white/5 shadow-none">
                I'm ready! Try asking me a question. As a <span className="text-white font-bold capitalize">{role}</span>, I will automatically route your query to the documents or database and apply the correct security filters.
              </div>
            </div>
          </motion.div>
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
              placeholder="Ask anything about products, sales, or company data..."
              className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 py-3 text-sm font-medium"
            />
            <button className="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-all shadow-lg flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Enterprise Agentic RAG • Secured by Row-Level Policies</span>
          </div>
        </div>
      </div>
    </main>
  );
}
