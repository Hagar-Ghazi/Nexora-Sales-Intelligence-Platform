"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  user_id: string;
  email: string;
  role: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setupRequired: boolean;
  checkSetupStatus: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  setupAdmin: (email: string, password_plain: string, full_name: string) => Promise<void>;
  logout: () => void;
  registerUser: (email: string, password_plain: string, full_name: string, role: string) => Promise<any>;
  updateUser: (user_id: string, email: string, full_name: string, role: string, password_plain?: string) => Promise<any>;
  deleteUser: (user_id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkSetupStatus = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/setup-status');
      if (res.ok) {
        const data = await res.json();
        setSetupRequired(data.setup_required);
        return data.setup_required;
      }
    } catch (err) {
      console.error("Failed to check setup status:", err);
    }
    return false;
  };

  useEffect(() => {
    async function loadUserFromStorage() {
      // 1. Check if system requires initial setup
      const isSetupNeeded = await checkSetupStatus();
      
      const storedToken = localStorage.getItem('token');
      if (storedToken && !isSetupNeeded) {
        setToken(storedToken);
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token expired or invalid
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            if (pathname !== '/login') {
              router.push('/login');
            }
          }
        } catch (err) {
          console.error("Failed to load user:", err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } else {
        setUser(null);
        setToken(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    }
    loadUserFromStorage();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(errData.detail || "Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setSetupRequired(false);
      router.push('/');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const setupAdmin = async (email: string, password_plain: string, full_name: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password: password_plain,
          full_name
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Admin setup failed" }));
        throw new Error(errData.detail || "Failed to register admin.");
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setSetupRequired(false);
      router.push('/');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const registerUser = async (email: string, password_plain: string, full_name: string, role: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        password: password_plain,
        full_name,
        role
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(errData.detail || "Failed to create user");
    }

    return await res.json();
  };

  const updateUser = async (user_id: string, email: string, full_name: string, role: string, password_plain?: string) => {
    if (!token) throw new Error("Not authenticated");
    
    const body: Record<string, any> = {
      email,
      full_name,
      role
    };
    
    if (password_plain && password_plain.trim().length > 0) {
      body.password = password_plain;
    }

    const res = await fetch(`/api/users/${user_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Failed to update user" }));
      throw new Error(errData.detail || "Failed to update user.");
    }

    return await res.json();
  };

  const deleteUser = async (user_id: string) => {
    if (!token) throw new Error("Not authenticated");
    
    const res = await fetch(`/api/users/${user_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Failed to delete user" }));
      throw new Error(errData.detail || "Failed to delete user.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setupRequired, checkSetupStatus, login, setupAdmin, logout, registerUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
