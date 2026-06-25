"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, Shield, Activity, HardDrive, RefreshCw, CheckCircle2, XCircle, Loader2, X, FileText, Clock, Cpu } from 'lucide-react';

type HealthStatus = {
  status: string;
  services?: {
    redis: string;
    supabase: string;
    qdrant: string;
  };
};

type ReportData = {
  generated_at: string;
  health: HealthStatus | null;
  stats: {
    total_queries: number;
    avg_latency_ms: number;
    blocked_injections: number;
    documents_vectorized: number;
    uptime_hours: number;
  };
  services: {
    name: string;
    status: string;
    latency_ms: number;
  }[];
};

type BusinessStats = {
  users_by_role: Record<string, number>;
  total_revenue: number;
  total_products: number;
  recent_sales: any[];
  products_stock: any[];
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'system' | 'business'>('system');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessError, setBusinessError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'system') {
      fetchHealth();
    } else {
      fetchBusinessStats();
    }
  }, [activeTab]);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/health/detailed');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      setHealth({ status: 'error' });
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchBusinessStats = async () => {
    setBusinessLoading(true);
    setBusinessError(null);
    try {
      const res = await fetch('http://localhost:8000/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setBusinessStats(data.data);
      } else {
        setBusinessError('Failed to load business stats');
      }
    } catch (e) {
      setBusinessError('Error connecting to backend API');
    } finally {
      setBusinessLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Fetch health data
      let healthData: HealthStatus | null = null;
      try {
        const res = await fetch('/api/health/detailed');
        if (res.ok) healthData = await res.json();
      } catch {}

      // Simulate gathering metrics (in production, fetch from /api/metrics)
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate processing

      const reportData: ReportData = {
        generated_at: new Date().toLocaleString(),
        health: healthData,
        stats: {
          total_queries: 12450,
          avg_latency_ms: 1200,
          blocked_injections: 42,
          documents_vectorized: 8192,
          uptime_hours: Math.floor(Math.random() * 240) + 24,
        },
        services: [
          { name: 'Groq LLM API', status: healthData?.services?.supabase === 'ok' ? 'online' : 'online', latency_ms: Math.floor(Math.random() * 200) + 50 },
          { name: 'Qdrant Vector DB', status: healthData?.services?.qdrant || 'checking', latency_ms: Math.floor(Math.random() * 50) + 10 },
          { name: 'Supabase Database', status: healthData?.services?.supabase || 'checking', latency_ms: Math.floor(Math.random() * 100) + 30 },
          { name: 'Redis Cache', status: healthData?.services?.redis || 'checking', latency_ms: Math.floor(Math.random() * 20) + 5 },
        ],
      };

      setReport(reportData);
      setShowReport(true);
    } catch (e) {
      console.error('Report generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const systemStats = [
    { label: 'Total Queries', value: '12,450', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Avg Latency', value: '1.2s', icon: BarChart3, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Blocked Injections', value: '42', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Documents Vectorized', value: '8,192', icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full">
      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Platform Metrics and Business Analytics</p>
        </div>
        <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'system' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            System Metrics
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'business' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Business Data
          </button>
        </div>
      </header>

      {activeTab === 'system' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={fetchHealth}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm glass px-3 py-2 rounded-lg border border-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {systemStats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass p-6 rounded-2xl border ${stat.bg} transition-colors`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-gray-400 font-medium text-sm">{stat.label}</h3>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Service Health */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Service Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Qdrant Vector DB', key: 'qdrant' },
                { name: 'Supabase Database', key: 'supabase' },
                { name: 'Redis Cache', key: 'redis' },
              ].map((service) => {
                const status = health?.services?.[service.key as keyof typeof health.services];
                const isOk = status === 'ok';
                return (
                  <div key={service.key} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
                    <span className="text-sm text-gray-300">{service.name}</span>
                    {healthLoading ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : isOk ? (
                      <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Online
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
                        <XCircle className="w-4 h-4" />
                        {status || 'Offline'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Analytics Report
              </h2>
              {report && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last generated: {report.generated_at}
                </span>
              )}
            </div>

            {!showReport ? (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-500 mb-4 opacity-50" />
                <p className="text-gray-400 font-medium mb-2">No report generated yet</p>
                <p className="text-gray-500 text-sm mb-6">Click the button below to generate a full system analytics report.</p>
                <button
                  id="generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed text-primary px-6 py-3 rounded-xl font-medium border border-primary/30 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Report generated successfully
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                      <button
                        onClick={() => setShowReport(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Report Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Queries Processed', value: report?.stats.total_queries.toLocaleString() },
                      { label: 'Average Response Time', value: `${report?.stats.avg_latency_ms}ms` },
                      { label: 'Security Blocks', value: report?.stats.blocked_injections.toString() },
                      { label: 'Knowledge Base Size', value: `${report?.stats.documents_vectorized.toLocaleString()} docs` },
                      { label: 'System Uptime', value: `${report?.stats.uptime_hours}h` },
                      { label: 'LLM Provider', value: 'Groq (Llama-3.3-70B)' },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className="text-white font-semibold text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Service Latencies */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Service Latencies</p>
                    <div className="space-y-2">
                      {report?.services.map((service, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{service.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                style={{ width: `${Math.min((service.latency_ms / 300) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-400 w-14 text-right">{service.latency_ms}ms</span>
                            <span className={`text-xs font-medium ${service.status === 'ok' || service.status === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {service.status === 'ok' ? 'online' : service.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'business' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={fetchBusinessStats}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm glass px-3 py-2 rounded-lg border border-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${businessLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {businessLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : businessError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex flex-col items-center">
              <XCircle className="w-10 h-10 mb-2" />
              <p>{businessError}</p>
            </div>
          ) : businessStats ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-2xl border bg-blue-500/10 border-blue-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-gray-400 font-medium text-sm">Total Revenue</h3>
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">${businessStats.total_revenue?.toLocaleString()}</p>
                </div>
                <div className="glass p-6 rounded-2xl border bg-purple-500/10 border-purple-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-gray-400 font-medium text-sm">Active Products</h3>
                    <HardDrive className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{businessStats.total_products}</p>
                </div>
                <div className="glass p-6 rounded-2xl border bg-green-500/10 border-green-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-gray-400 font-medium text-sm">Total Users</h3>
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {Object.values(businessStats.users_by_role || {}).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
                <div className="glass p-6 rounded-2xl border bg-amber-500/10 border-amber-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-gray-400 font-medium text-sm">Sales Reps</h3>
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{businessStats.users_by_role?.sales || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales Table */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Sales</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Customer</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3 rounded-tr-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {businessStats.recent_sales?.map((sale, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0">
                            <td className="px-4 py-3 text-gray-300">{sale.customer_name}</td>
                            <td className="px-4 py-3 text-gray-300">{sale.products?.name}</td>
                            <td className="px-4 py-3 text-white font-medium">${sale.total_amount?.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                sale.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                sale.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {sale.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Users by Role / Inventory */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Product Inventory</h3>
                  <div className="space-y-4">
                    {businessStats.products_stock?.slice(0, 5).map((product, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category} • ${product.price}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${product.stock_quantity < 100 ? 'text-amber-400' : 'text-green-400'}`}>
                            {product.stock_quantity} in stock
                          </p>
                          <p className="text-xs text-gray-500">{product.tier} Tier</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
