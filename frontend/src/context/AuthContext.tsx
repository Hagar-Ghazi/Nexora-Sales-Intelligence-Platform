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
  login: (email: string, password: str) => Promise<void>;
  logout: () => void;
  registerUser: (email: string, password_plain: string, full_name: string, role: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUserFromStorage() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
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

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, registerUser }}>
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
