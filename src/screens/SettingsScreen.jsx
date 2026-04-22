import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { STATUS_OPTIONS, LOGO_OPTIONS, BG_OPTIONS } from '../constants/config';
import './SettingsScreen.css';

export default function SettingsScreen() {
  const { mode, setMode, logoStyle, setLogoStyle, bgStyle, setBgStyle } = useTheme();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState(user?.status || 'online');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBio, setNewBio] = useState(user?.bio || '');
  const [accountMsg, setAccountMsg] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }
    try {
      await authService.uploadProfilePicture(file);
      refreshUser();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (val) => {
    setStatus(val);
    try {
      await authService.updateProfile({ status: val });
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return;
    if (newUsername.length > 15) { setAccountMsg('Username must be 15 characters or fewer'); return; }
    try {
      await authService.updateProfile({ username: newUsername.trim() });
      refreshUser();
      setNewUsername('');
      setAccountMsg('Username updated!');
      setTimeout(() => setAccountMsg(''), 3000);
    } catch (err) {
      setAccountMsg(err.message || 'Failed to update username');
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    try {
      await authService.updateProfile({ email: newEmail.trim() });
      refreshUser();
      setNewEmail('');
      setAccountMsg('Email updated!');
      setTimeout(() => setAccountMsg(''), 3000);
    } catch (err) {
      setAccountMsg(err.message || 'Failed to update email');
    }
  };

  const handleBioChange = async () => {
    try {
      await authService.updateProfile({ bio: newBio.trim() });
      refreshUser();
      setAccountMsg('Bio updated!');
      setTimeout(() => setAccountMsg(''), 3000);
    } catch (err) {
      setAccountMsg(err.message || 'Failed to update bio');
    }
  };

  const handleResetPassword = async () => {
    const email = user?.email;
    if (!email) { alert('No email on file'); return; }
    try {
      await authService.resetPassword(email);
      alert(`Password reset email sent to ${email}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2>Settings</h2>
      </header>

      {/* Theme */}
      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="theme-options">
          {[
            { val: 'light', icon: <Sun size={16} />, label: 'Light' },
            { val: 'dark', icon: <Moon size={16} />, label: 'Dark' },
            { val: 'system', icon: <Monitor size={16} />, label: 'System' },
          ].map((opt) => (
            <button
              key={opt.val}
              className={`theme-btn ${mode === opt.val ? 'active' : ''}`}
              onClick={() => setMode(opt.val)}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Logo Style */}
      <section className="settings-section">
        <h3>Logo Style</h3>
        <div className="logo-options">
          {LOGO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`logo-opt ${logoStyle === opt.value ? 'active' : ''}`}
              onClick={() => setLogoStyle(opt.value)}
            >
              <span
                className="logo-preview"
                style={{ background: `linear-gradient(135deg, ${opt.colors[0]}, ${opt.colors[1]})` }}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Background */}
      <section className="settings-section">
        <h3>Background</h3>
        <div className="bg-options">
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`bg-opt ${bgStyle === opt.value ? 'active' : ''}`}
              onClick={() => setBgStyle(opt.value)}
            >
              <div
                className="bg-preview"
                style={{ background: opt.bg || 'var(--bg-primary)' }}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Status */}
      <section className="settings-section">
        <h3>Status</h3>
        <div className="status-options">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`status-btn ${status === opt.value ? 'active' : ''}`}
              onClick={() => handleStatusChange(opt.value)}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Profile Picture */}
      <section className="settings-section">
        <h3>Profile Picture</h3>
        <button className="settings-row" onClick={() => fileRef.current?.click()}>
          Upload new photo (max 10MB)
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePicUpload} />
      </section>

      {/* Account */}
      <section className="settings-section">
        <h3>Account</h3>
        {accountMsg && <p className="settings-msg">{accountMsg}</p>}
        <div className="settings-input-row">
          <input
            className="settings-input"
            type="text"
            placeholder={`Current: @${user?.username || ''}`}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            maxLength={15}
          />
          <button className="settings-save-btn" onClick={handleUsernameChange}>Update</button>
        </div>
        <div className="settings-input-row">
          <input
            className="settings-input"
            type="email"
            placeholder={`Current: ${user?.email || ''}`}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button className="settings-save-btn" onClick={handleEmailChange}>Update</button>
        </div>
        <div className="settings-input-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          <textarea
            className="settings-input"
            placeholder="Bio (optional, shown on your profile)"
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
            maxLength={150}
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <button className="settings-save-btn" onClick={handleBioChange}>Update bio</button>
        </div>
        <button className="settings-row" onClick={handleResetPassword}>
          Reset password
        </button>
      </section>

      {/* About */}
      <section className="settings-section">
        <h3>About</h3>
        <button className="settings-row" onClick={() => navigate(ROUTES.CHANGELOG)}>
          📋 Patch Notes
        </button>
        <div className="settings-version">Aura v1.5.0</div>
      </section>
    </div>
  );
}
