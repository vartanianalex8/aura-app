import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Parse from '../services/parse';
import { notificationService } from '../services/notifications';
import { timeAgo } from '../utils/helpers';
import './NotificationsScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');

const TYPE_CONFIG = {
  reaction: { emoji: '❤️', label: 'reacted to your post' },
  comment: { emoji: '💬', label: 'commented on your post' },
  follow: { emoji: '👤', label: 'started following you' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [avatars, setAvatars] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
      await notificationService.markAllRead();

      // Fetch avatars from UserIndex for all unique senders
      const uniqueIds = [...new Set(data.map((n) => n.fromUserId).filter(Boolean))];
      if (uniqueIds.length > 0) {
        const q = new Parse.Query(UserIndex);
        q.containedIn('userId', uniqueIds);
        q.limit(uniqueIds.length);
        const results = await q.find().catch(() => []);
        const map = {};
        results.forEach((r) => { map[r.get('userId')] = r.get('profilePictureUrl') || null; });
        setAvatars(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTap = (n) => {
    if (n.fromUserId) navigate(`/user/${n.fromUserId}`);
  };

  return (
    <div className="notifications-screen">
      <header className="notifications-header">
        <h2>Notifications</h2>
      </header>

      {loading ? (
        <div className="notifications-empty">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <p className="notifications-empty-title">All quiet</p>
          <p className="notifications-empty-sub">When people react, comment, or follow you, it'll show up here</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || { emoji: '🔔', label: '' };
            const avatarUrl = avatars[n.fromUserId] || null;
            return (
              <div
                key={n.objectId}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => handleTap(n)}
              >
                <div className="notification-avatar">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" />
                    : <div className="notification-avatar-ph">{config.emoji}</div>}
                </div>
                <div className="notification-body">
                  <p className="notification-text">
                    <span className="notification-actor">@{n.fromUsername}</span>
                    {' '}{config.label}
                    {n.message ? <span className="notification-preview"> · "{n.message}"</span> : ''}
                  </p>
                  <span className="notification-time">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.read && <div className="notification-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
