"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel w-full max-w-md p-8 relative z-10 border border-white/10"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-2">Nexora Login</h2>
        <p className="text-center text-gray-400 text-sm mb-8">Access the Sales Intelligence Platform</p>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/20">
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Protected by Enterprise SSO and Row-Level Security
          </p>
        </div>
      </motion.div>
    </div>
  );
}
