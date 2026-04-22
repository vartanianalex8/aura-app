import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import '../styles/auth.css';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await logIn(identifier, password);
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">Aura</div>
      <p className="auth-tagline">Capture the moment. Ditch the noise.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <input
          className="auth-input"
          type="text"
          placeholder="Username or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Log In'}
        </button>

        <p className="auth-link">
          <Link to={ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
        </p>

        <div className="auth-divider">or</div>

        <p className="auth-link">
          Don't have an account? <Link to={ROUTES.SIGNUP}>Sign Up</Link>
        </p>
      </form>
    </div>
  );
}
