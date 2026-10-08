import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'college-lost-found-token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return () => { active = false; };
    }

    api.get('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(details) {
    const { data } = await api.post('/auth/register', details);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    }
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  function updateUser(updatedUser) {
    setUser((current) => (current ? { ...current, ...updatedUser } : updatedUser));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}