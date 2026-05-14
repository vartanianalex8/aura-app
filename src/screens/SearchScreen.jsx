import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, X, FileText } from 'lucide-react';
import Parse from '../services/parse';
import { socialService } from '../services/social';
import './SearchScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');
const Post = Parse.Object.extend('Post');

const RECENT_KEY = 'aura_recent_searches_v2';
const MAX_RECENT = 10;

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveUserToRecent(user) {
  try {
    const current = getRecentSearches().filter((r) => r.userId !== user.userId);
    const entry = { type: 'user', userId: user.userId, username: user.username, profilePictureUrl: user.profilePictureUrl || null, ts: Date.now() };
    const updated = [entry, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

function removeFromRecent(id) {
  try {
    const updated = getRecentSearches().filter((r) => (r.userId || r.query) !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

function clearAllRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('people');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    socialService.getTrendingHashtags(8).then(setTrending).catch(() => {});
  }, []);

  // Live search as user types
  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setUsers([]); setPosts([]); return; }
    debounceRef.current = setTimeout(() => runSearch(val), 200);
  };

  const runSearch = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      if (tab === 'people') {
        await searchPeople(term);
      } else {
        await searchPosts(term);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchPeople = async (term) => {
    const clean = term.trim().replace(/^@/, '');
    let found = [];
    try {
      const q = new Parse.Query(UserIndex);
      q.matchesRegex('username', clean, 'i');
      q.limit(15);
      found = await q.find();
    } catch {
      try {
        const q1 = new Parse.Query(UserIndex);
        q1.startsWith('username', clean.toLowerCase());
        const q2 = new Parse.Query(UserIndex);
        q2.equalTo('username', clean);
        const combined = Parse.Query.or(q1, q2);
        combined.limit(15);
        found = await combined.find();
      } catch (e) { console.warn('[Aura] Search fallback:', e.message); }
    }
    setUsers(found.map((u) => ({
      userId: u.get('userId'),
      username: u.get('username') || '',
      streakCount: u.get('streakCount') || 0,
      profilePictureUrl: u.get('profilePictureUrl') || null,
      bio: u.get('bio') || '',
    })));
  };

  const searchPosts = async (term) => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const clean = term.trim().toLowerCase().replace(/^#/, '');
    const tagQuery = new Parse.Query(Post);
    tagQuery.equalTo('hashtags', clean);
    tagQuery.greaterThan('createdAt', cutoff);
    const captionQuery = new Parse.Query(Post);
    captionQuery.matches('caption', new RegExp(clean, 'i'));
    captionQuery.greaterThan('createdAt', cutoff);
    let results = [];
    try {
      const combined = Parse.Query.or(tagQuery, captionQuery);
      combined.descending('createdAt');
      combined.limit(30);
      results = await combined.find();
    } catch { results = await tagQuery.find().catch(() => []); }
    const seen = new Set();
    setPosts(results
      .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; })
      .map((p) => ({
        objectId: p.id,
        caption: p.get('caption') || '',
        hashtags: p.get('hashtags') || [],
        image: p.get('image') ? { url: p.get('image').url() } : null,
        authorUsername: p.get('authorUsername') || 'unknown',
        authorId: p.get('authorId'),
      }))
    );
  };

  // Re-run when tab changes with existing query
  useEffect(() => {
    if (query.trim()) runSearch(query);
    else { setUsers([]); setPosts([]); }
  }, [tab]);

  const handleUserTap = (user) => {
    saveUserToRecent(user);
    setRecentSearches(getRecentSearches());
    navigate(`/user/${user.userId}`);
  };

  const handleRemoveRecent = (e, id) => {
    e.stopPropagation();
    removeFromRecent(id);
    setRecentSearches(getRecentSearches());
  };

  const handleClearAll = () => { clearAllRecent(); setRecentSearches([]); };

  const clearSearch = () => { setQuery(''); setUsers([]); setPosts([]); };

  const hasResults = query.trim() && (users.length > 0 || posts.length > 0 || loading);
  const showRecent = !query.trim() && recentSearches.length > 0;
  const showTrending = !query.trim() && trending.length > 0;

  return (
    <div className="search-screen">
      <header className="search-header">
        <h2>Search</h2>
      </header>

      <div className="search-bar">
        <Search size={18} />
        <input
          placeholder={tab === 'people' ? 'Search people...' : 'Search posts & hashtags...'}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="search-tabs">
        <button className={`search-tab ${tab === 'people' ? 'active' : ''}`} onClick={() => setTab('people')}>
          👤 People
        </button>
        <button className={`search-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
          <FileText size={14} /> Posts
        </button>
      </div>

      {/* Live results */}
      {query.trim() && (
        <div className="search-results">
          {loading && <div className="search-status">Searching...</div>}

          {!loading && tab === 'people' && (
            users.length === 0
              ? <div className="search-empty"><p>No people found for "{query}"</p></div>
              : users.map((u) => (
                  <UserRow key={u.userId} user={u} onTap={() => handleUserTap(u)} />
                ))
          )}

          {!loading && tab === 'posts' && (
            posts.length === 0
              ? <div className="search-empty"><p>No posts found for "{query}"</p></div>
              : <div className="search-post-list">
                  {posts.map((p) => (
                    <div key={p.objectId} className="search-post-row" onClick={() => navigate(`/user/${p.authorId}`)}>
                      {p.image
                        ? <div className="search-post-thumb"><img src={p.image.url} alt="" /></div>
                        : <div className="search-post-thumb search-post-thumb--text">✦</div>}
                      <div className="search-post-info">
                        <p className="search-post-author">@{p.authorUsername}</p>
                        {p.caption && <p className="search-post-caption">{p.caption.slice(0, 80)}{p.caption.length > 80 ? '…' : ''}</p>}
                        {p.hashtags.length > 0 && <p className="search-post-tags">{p.hashtags.slice(0, 3).map(t => `#${t}`).join(' ')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
          )}
        </div>
      )}

      {/* Recent searches */}
      {showRecent && (
        <div className="recent-searches">
          <div className="recent-header">
            <span className="recent-title">Recent</span>
            <button className="recent-clear-all" onClick={handleClearAll}>Clear all</button>
          </div>
          {recentSearches.map((r) => (
            r.type === 'user' ? (
              <div key={r.userId} className="search-user-row" onClick={() => navigate(`/user/${r.userId}`)}>
                <div className="search-avatar">
                  {r.profilePictureUrl ? <img src={r.profilePictureUrl} alt="" /> : <div className="search-avatar-ph" />}
                </div>
                <div className="search-user-info">
                  <p className="search-username">@{r.username}</p>
                  <p className="search-streak" style={{ fontSize: '11px' }}>Recent search</p>
                </div>
                <button className="recent-remove" onClick={(e) => handleRemoveRecent(e, r.userId)}>
                  <X size={14} />
                </button>
              </div>
            ) : null
          ))}
        </div>
      )}

      {/* Trending */}
      {showTrending && (
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
    </div>
  );
}

function UserRow({ user, onTap }) {
  return (
    <div className="search-user-row" onClick={onTap}>
      <div className="search-avatar">
        {user.profilePictureUrl ? <img src={user.profilePictureUrl} alt="" /> : <div className="search-avatar-ph" />}
      </div>
      <div className="search-user-info">
        <p className="search-username">@{user.username}</p>
        <p className="search-streak">{user.bio || `🔥 ${user.streakCount} day streak`}</p>
      </div>
      <span className="search-chevron">›</span>
    </div>
  );
}
