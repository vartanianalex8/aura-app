import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, Trophy } from 'lucide-react';
import { socialService } from '../services/social';
import { useAuth } from '../hooks/useAuth';
import './LeaderboardScreen.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    socialService.getStreakLeaderboard(20)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lb-screen">
      <header className="lb-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2>Streak Leaderboard</h2>
      </header>

      {loading ? (
        <p className="lb-loading">Loading leaderboard...</p>
      ) : users.length === 0 ? (
        <div className="lb-empty">
          <Trophy size={40} />
          <p>No streaks yet — be the first!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="lb-podium">
            {users.slice(0, 3).map((u, i) => (
              <div key={u.objectId} className={`podium-item podium-${i + 1}`}>
                <div className="podium-avatar">
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt="" />
                  ) : (
                    <div className="podium-avatar-ph" />
                  )}
                  <span className="podium-medal">{MEDALS[i]}</span>
                </div>
                <p className="podium-name">@{u.username}</p>
                <p className="podium-streak">
                  <Flame size={14} /> {u.streakCount}
                </p>
              </div>
            ))}
          </div>

          {/* Rest of list */}
          <div className="lb-list">
            {users.slice(3).map((u) => (
              <div
                key={u.objectId}
                className={`lb-row ${u.objectId === currentUser?.objectId ? 'lb-row--me' : ''}`}
              >
                <span className="lb-rank">#{u.rank}</span>
                <div className="lb-avatar">
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt="" />
                  ) : (
                    <div className="lb-avatar-ph" />
                  )}
                </div>
                <span className="lb-name">@{u.username}</span>
                <span className="lb-streak-val">
                  <Flame size={14} /> {u.streakCount}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
