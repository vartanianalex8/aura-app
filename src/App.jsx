import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ROUTES } from './constants/routes';
import AppShell from './navigation/AppShell';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import PostScreen from './screens/PostScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ChangelogScreen from './screens/ChangelogScreen';
import SavedScreen from './screens/SavedScreen';
import HashtagScreen from './screens/HashtagScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import './styles/global.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            style={{ padding: '0.6rem 1.5rem', borderRadius: '999px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to={ROUTES.LOGIN} />;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={ROUTES.HOME} /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<AuthRoute><LoginScreen /></AuthRoute>} />
      <Route path={ROUTES.SIGNUP} element={<AuthRoute><SignupScreen /></AuthRoute>} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordScreen />} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<HomeScreen />} />
        <Route path={ROUTES.POST} element={<PostScreen />} />
        <Route path={ROUTES.SEARCH} element={<SearchScreen />} />
        <Route path={ROUTES.PROFILE} element={<ProfileScreen />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsScreen />} />
        <Route path={ROUTES.CHANGELOG} element={<ChangelogScreen />} />
        <Route path="/saved" element={<SavedScreen />} />
        <Route path="/hashtag/:tag" element={<HashtagScreen />} />
        <Route path="/user/:userId" element={<UserProfileScreen />} />
        <Route path="/help" element={<div style={{padding:20,color:'var(--text-secondary)'}}>Help Center — Coming Soon</div>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
