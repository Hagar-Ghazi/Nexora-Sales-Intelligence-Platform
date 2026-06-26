"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, Shield, Activity, HardDrive, Plus, X, UserPlus, AlertCircle, Loader2, Edit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user, token, registerUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // Deny access if not Admin or Manager
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0F19] text-white p-8">
        <div className="max-w-md text-center p-8 bg-red-950/20 border border-red-500/30 rounded-3xl backdrop-blur-xl">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm">
            You do not have permission to view this dashboard. Only Admin and Manager accounts are authorized.
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

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-[#0B0F19] text-white">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">System Dashboard</h1>
          <p className="text-gray-400 mt-2">Agentic RAG Performance & Security Metrics</p>
        </div>

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
      </header>

      {activeTab === 'overview' && (
        <>
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
                className="glass p-6 rounded-2xl hover:bg-white/5 transition-colors border border-white/5 bg-white/5"
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
          <div className="glass-panel p-12 border border-white/10 flex items-center justify-center bg-white/5 rounded-3xl backdrop-blur-xl">
            <div className="text-center max-w-md">
              <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-75 shadow-lg" />
              <p className="text-gray-300 font-semibold text-lg mb-2">Metrics & Health Analytics</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Detailed telemetry logging and security audit logs are being compiled from active worker nodes.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/20 transition-all border border-blue-500/30">
                Generate Security Report
              </button>
            </div>
          </div>
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
            
            {/* Show "Add User" only to admin */}
            {user.role === 'admin' ? (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-blue-500/20 transition-all border border-blue-500/30"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            ) : (
              <span className="text-xs text-gray-500 border border-white/5 bg-white/5 px-3 py-1.5 rounded-xl">
                🔒 Manager Read-Only Mode
              </span>
            )}
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
                    {user.role === 'admin' && <th className="py-3 px-4 text-right">Actions</th>}
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
                      {user.role === 'admin' && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all inline-flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-white/10"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={user.role === 'admin' ? 5 : 4} className="py-8 text-center text-gray-500">
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
