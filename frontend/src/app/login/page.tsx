"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // For initial admin registration
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, setupRequired, setupAdmin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (setupRequired && !fullName)) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (setupRequired && password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (setupRequired) {
        await setupAdmin(email, password, fullName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0B0F19] text-white p-4">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel w-full max-w-md p-8 relative z-10 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          {setupRequired ? "Admin Registration" : "Nexora Login"}
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          {setupRequired 
            ? "Create the system's first Administrator account" 
            : "Access the Sales Intelligence Platform"}
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {setupRequired && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Admin User"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
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
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                setupRequired ? "Registering..." : "Signing In..."
              ) : (
                setupRequired ? "Register Admin" : "Sign In"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-500">
            Protected by Enterprise SSO and Row-Level Security
          </p>
        </div>
      </motion.div>
    </div>
  );
}
