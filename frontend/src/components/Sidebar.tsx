"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, BarChart3, Settings, LogOut, Hexagon } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const navItems = [
    { name: 'Agent Chat', path: '/', icon: MessageSquare },
    { name: 'Dashboard', path: '/admin', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen glass border-r border-white/5 flex flex-col justify-between shrink-0 relative z-20">
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

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              AS
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Alice Smith</span>
              <span className="text-xs text-gray-400">Sales Rep</span>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
