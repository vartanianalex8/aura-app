import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { STATUS_OPTIONS } from '../constants/config';
import './SettingsScreen.css';

export default function SettingsScreen() {
  const { mode, setMode } = useTheme();
  const { user, refreshUser, logOut } = useAuth();
  const [status, setStatus] = useState(user?.status || 'online');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
    try {
      await authService.uploadProfilePicture(file);
      refreshUser();
      setAccountMsg('Profile picture updated!');
      setTimeout(() => setAccountMsg(''), 3000);
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

      {/* Appearance */}
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

      {/* Account */}
      <section className="settings-section">
        <h3>Account</h3>
        {accountMsg && <p className="settings-msg">{accountMsg}</p>}

        <p className="settings-field-label">Profile Picture</p>
        <button className="settings-row" onClick={() => fileRef.current?.click()}>
          Upload new photo <span className="settings-row-hint">max 10MB</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePicUpload} />

        <p className="settings-field-label">Username</p>
        <div className="settings-input-row">
          <input
            className="settings-input"
            type="text"
            placeholder={`@${user?.username || ''}`}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            maxLength={15}
          />
          <button className="settings-save-btn" onClick={handleUsernameChange}>Update</button>
        </div>

        <p className="settings-field-label">Email</p>
        <div className="settings-input-row">
          <input
            className="settings-input"
            type="email"
            placeholder={user?.email || ''}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button className="settings-save-btn" onClick={handleEmailChange}>Update</button>
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
        <div className="settings-version">Aura v1.6.0</div>
      </section>

      {/* Logout */}
      <section className="settings-section">
        <button className="settings-logout-btn" onClick={logOut}>Log Out</button>
      </section>
    </div>
  );
}
