import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Parse from '../services/parse';
import { moderationService } from '../services/moderation';
import { useAuth } from '../hooks/useAuth';

const UserIndex = Parse.Object.extend('UserIndex');

export default function BlockedUsersScreen() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const ids = moderationService.getBlockedUsers();
    if (ids.length === 0) { setBlockedProfiles([]); setLoading(false); return; }
    try {
      const q = new Parse.Query(UserIndex);
      q.containedIn('userId', ids);
      q.limit(ids.length);
      const results = await q.find();
      setBlockedProfiles(results.map((r) => ({
        userId: r.get('userId'),
        username: r.get('username') || 'Unknown',
        profilePictureUrl: r.get('profilePictureUrl') || null,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    setUnblocking(userId);
    try {
      await moderationService.unblockUser(userId);
      await refreshUser();
      setBlockedProfiles((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      alert(err.message);
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
        <h2>Blocked Users</h2>
      </header>
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading...</p>
      ) : blockedProfiles.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '2.5rem' }}>🙌</p>
          <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>No blocked users</p>
        </div>
      ) : (
        <div style={{ padding: '0 1rem' }}>
          {blockedProfiles.map((u) => (
            <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
                {u.profilePictureUrl ? <img src={u.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
              <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.9rem' }}>@{u.username}</span>
              <button onClick={() => handleUnblock(u.userId)} disabled={unblocking === u.userId}
                style={{ padding: '0.4rem 0.9rem', borderRadius: '999px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}>
                {unblocking === u.userId ? '...' : 'Unblock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
