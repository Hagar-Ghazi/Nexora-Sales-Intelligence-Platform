"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, BarChart3, LogOut, Hexagon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // If on login page or loading, do not show sidebar
  if (pathname === '/login' || !user) return null;

  // Filter navigation items based on role
  const showDashboard = user.role === 'admin' || user.role === 'manager';

  const navItems = [
    { name: 'Agent Chat', path: '/', icon: MessageSquare },
    ...(showDashboard ? [{ name: 'Dashboard', path: '/admin', icon: BarChart3 }] : []),
  ];

  // Helper to extract initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Get color styling for the user's role badge (sidebar version)
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'text-red-400 border-red-500/20 bg-red-500/10';
      case 'manager':
        return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
      case 'sales':
        return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
      case 'support':
        return 'text-green-400 border-green-500/20 bg-green-500/10';
      default:
        return 'text-gray-400 border-gray-500/20 bg-gray-500/10';
    }
  };

  return (
    <div className="w-64 h-screen glass border-r border-white/5 flex flex-col justify-between shrink-0 relative z-20 bg-[#070A13]">
      <div>
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Nexora</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path} className="block relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative px-4 py-3 flex items-center gap-3 rounded-xl transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate max-w-[110px]" title={user.full_name}>
                {user.full_name}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block w-fit mt-0.5 ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Log Out"
            className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
