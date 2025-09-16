"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'Superusuario' | 'Encargado de Comunicaciones, Transparencia y Participación Ciudadana' | 'Auditor';

interface User {
  username: string;
  fullName?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          localStorage.removeItem('user'); // Clear corrupted data
          if (window.location.pathname !== '/login') {
            router.push('/login');
          }
        }
      } else {
        if (window.location.pathname !== '/login') {
            router.push('/login');
        }
      }
    } catch (error) {
        console.error("Local storage is not available.", error)
    } finally {
      setLoading(false);
    }
  }, [router]);

  const login = async (username: string, pass: string) => {
    return new Promise<void>((resolve, reject) => {
      let userData: User | null = null;
      
      if (username === 'admin' && pass === 'admin') {
        userData = { username: 'admin', fullName: 'Administrador', role: 'Superusuario' };
      } else if (username === 'Fgonzalez' && pass === 'Unidad2025') {
        userData = { 
          username: 'Fgonzalez', 
          fullName: 'Felipe González Parraguez', 
          role: 'Encargado de Comunicaciones, Transparencia y Participación Ciudadana' 
        };
      } else if (username === 'SeguimientoSAI' && pass === 'UnidadTTA2025SAI') {
        userData = {
          username: 'SeguimientoSAI',
          fullName: 'Usuario de Seguimiento',
          role: 'Auditor'
        }
      }

      if (userData) {
        setUser(userData);
        try {
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error("Local storage is not available.", error);
        }
        resolve();
      } else {
        reject(new Error('Usuario o contraseña incorrectos.'));
      }
    });
  };

  const logout = () => {
    setUser(null);
    try {
        localStorage.removeItem('user');
    } catch (error) {
        console.error("Local storage is not available.", error);
    }
    router.push('/login');
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
