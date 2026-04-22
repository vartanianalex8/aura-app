import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, X } from 'lucide-react';
import Parse from '../services/parse';
import { socialService } from '../services/social';
import './SearchScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    socialService.getTrendingHashtags(8).then(setTrending).catch(() => {});
  }, []);

  const searchUsers = async (term) => {
    if (!term.trim()) {
      setUsers([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const clean = term.trim().replace(/^@/, '');

      // Query the public UserIndex class — bypasses _User CLP restrictions
      let found = [];
      try {
        const q = new Parse.Query(UserIndex);
        q.matchesRegex('username', clean, 'i');
        q.limit(15);
        found = await q.find();
      } catch {
        // Fallback: startsWith (case-sensitive but broader compatibility)
        try {
          const q1 = new Parse.Query(UserIndex);
          q1.startsWith('username', clean.toLowerCase());
          const q2 = new Parse.Query(UserIndex);
          q2.startsWith('username', clean);
          const q3 = new Parse.Query(UserIndex);
          q3.equalTo('username', clean);
          const combined = Parse.Query.or(q1, q2, q3);
          combined.limit(15);
          found = await combined.find();
        } catch (e2) {
          console.warn('[Aura] Search fallback failed:', e2.message);
        }
      }

      setUsers(found.map((u) => ({
        userId: u.get('userId'),
        username: u.get('username') || '',
        streakCount: u.get('streakCount') || 0,
        longestStreak: u.get('longestStreak') || 0,
        profilePictureUrl: u.get('profilePictureUrl') || null,
        bio: u.get('bio') || '',
      })));
    } catch (err) {
      console.error('[Aura] Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setUsers([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
  };

  const clearSearch = () => { setQuery(''); setUsers([]); setSearched(false); };

  return (
    <div className="search-screen">
      <header className="search-header">
        <h2>Search</h2>
      </header>

      <div className="search-bar">
        <Search size={18} />
        <input
          placeholder="Type a username to search..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchUsers(query)}
          autoComplete="off"
        />
        {query && (
          <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {searched && (
        <div className="search-results">
          {loading && <div className="search-status">Searching...</div>}
          {!loading && users.length === 0 && (
            <div className="search-empty"><p>No users found for "{query}"</p></div>
          )}
          {!loading && users.map((u) => (
            <div
              key={u.userId}
              className="search-user-row"
              onClick={() => navigate(`/user/${u.userId}`)}
            >
              <div className="search-avatar">
                {u.profilePictureUrl
                  ? <img src={u.profilePictureUrl} alt="" />
                  : <div className="search-avatar-ph" />}
              </div>
              <div className="search-user-info">
                <p className="search-username">{u.username}</p>
                <p className="search-streak">
                  {u.bio ? u.bio : `🔥 ${u.streakCount} day streak`}
                </p>
              </div>
              <span className="search-chevron">›</span>
            </div>
          ))}
        </div>
      )}

      {!searched && trending.length > 0 && (
        <section className="search-section">
          <h3><TrendingUp size={14} /> Trending</h3>
          <div className="trending-tags">
            {trending.map((t) => (
              <button key={t.tag} className="trending-chip" onClick={() => navigate(`/hashtag/${t.tag}`)}>
                #{t.tag}<span className="trending-count">{t.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!searched && !loading && (
        <div className="search-empty"><p>Search for people by username</p></div>
      )}
    </div>
  );
}
