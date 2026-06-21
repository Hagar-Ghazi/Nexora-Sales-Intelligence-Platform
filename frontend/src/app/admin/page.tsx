"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Shield, Activity, HardDrive } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">System Dashboard</h1>
        <p className="text-gray-400 mt-2">Agentic RAG Performance & Security Metrics</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Queries', value: '12,450', icon: Activity, color: 'text-blue-400' },
          { label: 'Avg Latency', value: '1.2s', icon: BarChart3, color: 'text-green-400' },
          { label: 'Blocked Injections', value: '42', icon: Shield, color: 'text-red-400' },
          { label: 'Documents Vectorized', value: '8,192', icon: HardDrive, color: 'text-purple-400' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-6 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-gray-400 font-medium text-sm">{stat.label}</h3>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Panel Area */}
      <div className="glass-panel p-6 h-96 border border-white/5 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 font-medium">Detailed Analytics UI will be hooked up to the /api/health metrics</p>
          <button className="mt-6 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg font-medium border border-primary/30 transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
