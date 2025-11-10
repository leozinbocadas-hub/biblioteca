import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '@/lib/supabase';

type AuthContextType = {
  user: Usuario | null;
  setUser: (user: Usuario | null) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('biblioteca_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('biblioteca_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleSetUser = (newUser: Usuario | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('biblioteca_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('biblioteca_user');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('biblioteca_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
