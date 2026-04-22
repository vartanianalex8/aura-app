import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    setLoading(false);
  }, []);

  const signUp = async (username, email, password) => {
    const u = await authService.signUp(username, email, password);
    setUser(u);
    return u;
  };

  const logIn = async (identifier, password) => {
    const u = await authService.logIn(identifier, password);
    setUser(u);
    return u;
  };

  const logOut = async () => {
    await authService.logOut();
    setUser(null);
  };

  const refreshUser = () => {
    const current = authService.getCurrentUser();
    setUser(current);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
