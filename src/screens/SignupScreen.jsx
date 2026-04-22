import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validatePassword, validateUsername } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import '../styles/auth.css';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const uErr = validateUsername(username);
    if (uErr) return setError(uErr);

    const pErr = validatePassword(password);
    if (pErr) return setError(pErr);

    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      await signUp(username, email, password);
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">Aura</div>
      <p className="auth-tagline">One moment a day. Make it count.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <input
          className="auth-input"
          type="text"
          placeholder="Username (max 15 chars)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={15}
          required
        />
        <input
          className="auth-input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password (8+ chars, 1 number, 1 special)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div className="auth-divider">or</div>

        <p className="auth-link">
          Already have an account? <Link to={ROUTES.LOGIN}>Log In</Link>
        </p>
      </form>
    </div>
  );
}
