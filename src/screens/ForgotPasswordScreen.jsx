import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { ROUTES } from '../constants/routes';
import '../styles/auth.css';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">Aura</div>
      <p className="auth-tagline">Reset your password</p>

      {sent ? (
        <div className="auth-form" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Check your email for a password reset link.
          </p>
          <p className="auth-link" style={{ marginTop: 20 }}>
            <Link to={ROUTES.LOGIN}>Back to login</Link>
          </p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <input
            className="auth-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="auth-link">
            <Link to={ROUTES.LOGIN}>Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
