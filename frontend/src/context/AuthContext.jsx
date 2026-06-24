import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cb_user');
    const token  = localStorage.getItem('cb_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cb_token', data.access_token);
      localStorage.setItem('cb_user',  JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      setUser(data.user);
      toast.success(`Bienvenue, ${data.user.name} ☕`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Identifiants incorrects');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('cb_token');
    localStorage.removeItem('cb_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast('Déconnexion réussie 👋');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
