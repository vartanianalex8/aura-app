import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import Parse from '../services/parse';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    setLoading(false);

    // Fetch fresh from server in background so file URLs (profile pic) are always populated
    if (current) {
      Parse.User.current()?.fetch()
        .then(() => setUser(authService.getCurrentUser()))
        .catch(() => {});
    }
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
