import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res  = await apiLogin(email, password);
    const data = res.data.data;

    // Backend uses isAdmin: Boolean (not a role field)
    if (!data.user || !data.user.isAdmin) {
      throw new Error('Access denied. Admin account required.');
    }

    localStorage.setItem('admin_token', data.accessToken);
    localStorage.setItem('admin_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
