"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Shield, Activity, HardDrive, Plus, X, 
  UserPlus, AlertCircle, Loader2, Edit2, RefreshCw, Bell, 
  Cpu, Layers, Globe, TrendingUp, Server, CheckCircle2, FileText 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user, token, registerUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard Metrics State
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Notification Alerts State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  
  // Add User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('sales');
  
  // Edit User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('sales');

  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fetch metrics data
  const fetchMetricsData = async () => {
    if (!token) return;
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const res = await fetch('/api/dashboard/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        const errData = await res.json();
        setMetricsError(errData.detail || "Failed to load metrics");
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      setMetricsError("Network error: failed to fetch dashboard metrics");
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch notifications data
  const fetchNotificationsData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Metrics effect
  useEffect(() => {
    if (activeTab === 'overview' && token) {
      fetchMetricsData();
    }
  }, [activeTab, token]);

  // Notifications effect
  useEffect(() => {
    if (token) {
      fetchNotificationsData();
      const interval = setInterval(fetchNotificationsData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Load users from backend when active tab changes to users
  useEffect(() => {
    if (activeTab === 'users' && token && user?.role === 'admin') {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const res = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
          }
        } catch (err) {
          console.error("Failed to fetch users:", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [activeTab, token]);

  // Clear unread indicator when dropdown is opened
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasUnread(false);
    }
  };

  // Deny access if not authorized
  const isAuthorized = user && ['admin', 'manager', 'support', 'sales'].includes(user.role);
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0F19] text-white p-8">
        <div className="max-w-md text-center p-8 bg-red-950/20 border border-red-500/30 rounded-3xl backdrop-blur-xl">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm">
            You do not have permission to view this dashboard. Please check your credentials or contact system operations.
          </p>
        </div>
      </div>
    );
  }

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    
    if (newPassword.length < 8) {
      setModalError("Password must be at least 8 characters long.");
      return;
    }

    setModalSubmitting(true);
    try {
      const created = await registerUser(newEmail, newPassword, newName, newRole);
      setUsers(prev => [...prev, created]);
      setShowAddUserModal(false);
      
      // Clear form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('sales');
    } catch (err: any) {
      setModalError(err.message || "Failed to create user.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleEditClick = (u: any) => {
    setEditingUserId(u.user_id);
    setEditName(u.full_name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword('');
    setModalError(null);
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (editPassword.trim() && editPassword.length < 8) {
      setModalError("Password must be at least 8 characters long.");
      return;
    }

    setModalSubmitting(true);
    try {
      const updated = await updateUser(
        editingUserId!,
        editEmail,
        editName,
        editRole,
        editPassword.trim() ? editPassword : undefined
      );

      // Update in local state list
      setUsers(prev => prev.map(u => u.user_id === editingUserId ? updated : u));
      setShowEditUserModal(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to update user.");
    } finally {
      setModalSubmitting(false);
    }
  };

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-[#0B0F19] text-white">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">System Dashboard</h1>
          <p className="text-gray-400 mt-2">Agentic RAG Performance & Security Metrics</p>
        </div>

        {/* Tab & Notification Control Row */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Tab Selector */}
          {user.role === 'admin' && (
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                User Management
              </button>
            </div>
          )}

          {/* Bell Notifications */}
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white relative"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            <AnimatePresence>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0E1322] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 max-h-96 overflow-y-auto backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button 
                      onClick={() => {
                        setNotifications([]);
                        setHasUnread(false);
                      }} 
                      className="text-[10px] text-gray-500 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No new alerts</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-xs font-semibold ${
                              notif.type === 'alert' ? 'text-red-400' :
                              notif.type === 'warning' ? 'text-yellow-400' :
                              notif.type === 'success' ? 'text-green-400' : 'text-blue-400'
                            }`}>
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-gray-500">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-normal">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          {loadingMetrics ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Querying database performance and metrics...</p>
            </div>
          ) : metricsError ? (
            <div className="max-w-md mx-auto my-12 p-6 bg-red-950/20 border border-red-500/30 rounded-2xl text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-semibold mb-2">Metrics Fetch Failed</p>
              <p className="text-xs text-gray-400 mb-4">{metricsError}</p>
              <button 
                onClick={fetchMetricsData}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/30 transition-all flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : (
            <div>
              {/* Header Label detailing Role View */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Live View: {user.role.toUpperCase()} DASHBOARD
                  </span>
                </div>
                <button 
                  onClick={fetchMetricsData}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all inline-flex items-center gap-1 text-xs border border-white/5 bg-white/5 hover:border-white/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {/* Layout 1: Business Dashboard (Admin, Manager, Sales) */}
              {metrics?.type === 'business' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                      { 
                        label: user.role === 'sales' ? 'My Sales Revenue' : 'Total Sales Revenue', 
                        value: formatCurrency(metrics.metrics.total_revenue), 
                        icon: TrendingUp, 
                        color: 'text-green-400' 
                      },
                      { 
                        label: user.role === 'sales' ? 'My Transactions' : 'Total Transactions', 
                        value: metrics.metrics.total_transactions, 
                        icon: Activity, 
                        color: 'text-blue-400' 
                      },
                      { 
                        label: user.role === 'sales' ? 'My Average Deal Size' : 'Average Order Value', 
                        value: formatCurrency(metrics.metrics.average_deal_size), 
                        icon: BarChart3, 
                        color: 'text-purple-400' 
                      },
                      { 
                        label: 'Active Catalog Products', 
                        value: metrics.metrics.active_products, 
                        icon: Layers, 
                        color: 'text-yellow-400' 
                      }
                    ].map((stat, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl p-6 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-gray-400 font-medium text-xs uppercase tracking-wider">{stat.label}</h3>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Regional Sales & Recent Transactions Rows */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left 2 Cols: Regional Sales & Recent Sales */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Regional Performance */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                          <Globe className="w-5 h-5 text-blue-500" />
                          <h3 className="text-md font-bold text-white">Regional Sales performance</h3>
                        </div>
                        <div className="space-y-4">
                          {metrics.metrics.regional_sales.map((reg: any, i: number) => {
                            const maxVal = metrics.metrics.regional_sales[0]?.total || 1;
                            const pct = Math.max(5, Math.min(100, (reg.total / maxVal) * 100));
                            return (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span>{reg.region}</span>
                                  <span>{formatCurrency(reg.total)}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {metrics.metrics.regional_sales.length === 0 && (
                            <p className="text-xs text-gray-500 py-4 text-center">No regional sales recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Recent Sales Table */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-md font-bold text-white mb-6">Recent Sales Transactions</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="py-2.5">Client</th>
                                <th className="py-2.5">Product</th>
                                <th className="py-2.5">Amount</th>
                                <th className="py-2.5">Date</th>
                                <th className="py-2.5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                              {metrics.metrics.recent_sales.map((sale: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3 font-semibold text-white">{sale.customer}</td>
                                  <td className="py-3">{sale.product_name}</td>
                                  <td className="py-3 font-medium text-green-400">{formatCurrency(sale.amount)}</td>
                                  <td className="py-3">{new Date(sale.date).toLocaleDateString()}</td>
                                  <td className="py-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      sale.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                      {sale.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {metrics.metrics.recent_sales.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center text-gray-500">No transactions found</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right 1 Col: Product Categories */}
                    <div className="space-y-8">
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-md font-bold text-white mb-6">Catalog Inventory Status</h3>
                        <div className="space-y-4">
                          {metrics.metrics.categories.map((cat: any, i: number) => (
                            <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold text-white uppercase block">{cat.category}</span>
                                <span className="text-[10px] text-gray-500">{cat.count} product types</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-white block">{cat.stock}</span>
                                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Units In Stock</span>
                              </div>
                            </div>
                          ))}
                          {metrics.metrics.categories.length === 0 && (
                            <p className="text-xs text-gray-500 py-4 text-center">No categories seeded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Layout 2: Technical Support Telemetry Dashboard */}
              {metrics?.type === 'system' && (
                <>
                  {/* System Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                      { label: 'Host CPU Load', value: `${metrics.metrics.performance.cpu.toFixed(1)}%`, icon: Cpu, color: 'text-blue-400' },
                      { label: 'System Memory', value: `${metrics.metrics.performance.memory.toFixed(1)}%`, icon: Server, color: 'text-purple-400' },
                      { label: 'Active Worker Threads', value: metrics.metrics.performance.threads, icon: Activity, color: 'text-green-400' },
                      { label: 'Vector Indexed Files', value: metrics.metrics.documents.total, icon: FileText, color: 'text-yellow-400' }
                    ].map((stat, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl p-6 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-gray-400 font-medium text-xs uppercase tracking-wider">{stat.label}</h3>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Support Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Backing Services Health & Document Registry */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Services Health */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-md font-bold text-white mb-6">Service Integration Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { name: 'Upstash Redis Cache', status: metrics.metrics.services.redis },
                            { name: 'Supabase PostgreSQL', status: metrics.metrics.services.supabase },
                            { name: 'Qdrant Vector Database', status: metrics.metrics.services.qdrant }
                          ].map((srv, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between h-28">
                              <span className="text-xs font-semibold text-gray-400">{srv.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${srv.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider">{srv.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Documents Telemetry */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-md font-bold text-white mb-6">Vector Store / Document Registry</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Storage Footprint</span>
                            <p className="text-lg font-bold mt-1 text-white">{formatBytes(metrics.metrics.documents.size)}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Ingested Files</span>
                            <p className="text-lg font-bold mt-1 text-green-400">{metrics.metrics.documents.ingested}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Processing</span>
                            <p className="text-lg font-bold mt-1 text-yellow-400">{metrics.metrics.documents.processing}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Failed vectorization</span>
                            <p className="text-lg font-bold mt-1 text-red-400">{metrics.metrics.documents.failed}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right column: User store registry details */}
                    <div className="space-y-8">
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-md font-bold text-white mb-6">User Store Telemetry</h3>
                        <div className="space-y-4">
                          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400">Total System Accounts</span>
                            <span className="text-md font-bold text-white">{metrics.metrics.users.total}</span>
                          </div>
                          <div className="h-px bg-white/5 my-2"></div>
                          {Object.entries(metrics.metrics.users.roles).map(([rl, count]: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="capitalize font-semibold text-gray-400">{rl}s</span>
                              <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider text-[10px] ${getRoleBadgeStyle(rl)}`}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'users' && user.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">User Directory</h2>
              <p className="text-xs text-gray-400 mt-1">Manage system accounts and their security credentials</p>
            </div>
            
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-blue-500/20 transition-all border border-blue-500/30"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">{u.full_name}</td>
                      <td className="py-3.5 px-4">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getRoleBadgeStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all inline-flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-white/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No users registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0E1322] border border-white/10 rounded-3xl max-w-md w-full p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-white">Create New User</h3>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 p-3.5 rounded-xl mb-4 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="john@nexora.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Must be min 8 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-[#0E1322] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="manager">Manager (Read & Telemetry)</option>
                    <option value="sales">Sales Representative (RLS Restricted)</option>
                    <option value="support">Customer Support (Limited Access)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-blue-500/30"
                  >
                    {modalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditUserModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0E1322] border border-white/10 rounded-3xl max-w-md w-full p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-white">Modify User Profile</h3>
                </div>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 p-3.5 rounded-xl mb-4 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="john@nexora.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                    New Password <span className="text-gray-600 font-normal">(Leave blank to keep current)</span>
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password if changing"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[#0E1322] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="manager">Manager (Read & Telemetry)</option>
                    <option value="sales">Sales Representative (RLS Restricted)</option>
                    <option value="support">Customer Support (Limited Access)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-blue-500/30"
                  >
                    {modalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
