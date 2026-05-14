import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, X, Users, FileText, Clock } from 'lucide-react';
import Parse from '../services/parse';
import { socialService } from '../services/social';
import './SearchScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');
const Post = Parse.Object.extend('Post');

const RECENT_KEY = 'aura_recent_searches';
const MAX_RECENT = 10;

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveRecentSearch(entry) {
  try {
    const current = getRecentSearches().filter((r) => r.query !== entry.query);
    const updated = [entry, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

function removeRecentSearch(query) {
  try {
    const updated = getRecentSearches().filter((r) => r.query !== query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

function clearRecentSearches() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('people');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    socialService.getTrendingHashtags(8).then(setTrending).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim()) runSearch(query, tab);
  }, [tab]);

  const runSearch = async (term, currentTab) => {
    if (!term.trim()) { setUsers([]); setPosts([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);

    if (currentTab === 'people') {
      try {
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
      } catch (err) { console.error(err); }
    } else {
      try {
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
        } catch { results = await tagQuery.find(); }
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
            createdAt: p.get('createdAt'),
          }))
        );
      } catch (err) { console.error(err); }
    }
    setLoading(false);
  };

  const commitSearch = (term, searchTab = tab) => {
    if (!term.trim()) return;
    saveRecentSearch({ query: term.trim(), tab: searchTab, ts: Date.now() });
    setRecentSearches(getRecentSearches());
    runSearch(term, searchTab);
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setUsers([]); setPosts([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => runSearch(val, tab), 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { commitSearch(query); }
  };

  const clearSearch = () => { setQuery(''); setUsers([]); setPosts([]); setSearched(false); inputRef.current?.focus(); };

  const handleRecentTap = (recent) => {
    setQuery(recent.query);
    setTab(recent.tab || 'people');
    setIsFocused(false);
    commitSearch(recent.query, recent.tab || 'people');
  };

  const handleRemoveRecent = (e, q) => {
    e.stopPropagation();
    removeRecentSearch(q);
    setRecentSearches(getRecentSearches());
  };

  const handleClearAll = () => { clearRecentSearches(); setRecentSearches([]); };

  const showRecent = !query.trim() && !searched && recentSearches.length > 0;
  const showDefault = !searched && !showRecent;

  return (
    <div className="search-screen">
      <header className="search-header">
        <h2>Search</h2>
      </header>

      <div className="search-bar">
        <Search size={18} />
        <input
          ref={inputRef}
          placeholder={tab === 'people' ? 'Search people...' : 'Search posts & hashtags...'}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search type tabs */}
      <div className="search-tabs">
        <button className={`search-tab ${tab === 'people' ? 'active' : ''}`} onClick={() => setTab('people')}>
          <Users size={14} /> People
        </button>
        <button className={`search-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
          <FileText size={14} /> Posts
        </button>
      </div>

      {/* Recent searches */}
      {showRecent && (
        <div className="recent-searches">
          <div className="recent-header">
            <span className="recent-title">Recent</span>
            <button className="recent-clear-all" onClick={handleClearAll}>Clear all</button>
          </div>
          {recentSearches.map((r) => (
            <div key={r.query + r.ts} className="recent-item" onClick={() => handleRecentTap(r)}>
              <div className="recent-icon"><Clock size={15} /></div>
              <div className="recent-info">
                <span className="recent-query">{r.query}</span>
                <span className="recent-tab-label">{r.tab === 'posts' ? 'Posts' : 'People'}</span>
              </div>
              <button className="recent-remove" onClick={(e) => handleRemoveRecent(e, r.query)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search results */}
      {searched && (
        <div className="search-results">
          {loading && <div className="search-status">Searching...</div>}

          {!loading && tab === 'people' && (
            users.length === 0
              ? <div className="search-empty"><p>No people found for "{query}"</p></div>
              : users.map((u) => (
                <div key={u.userId} className="search-user-row" onClick={() => { commitSearch(query); navigate(`/user/${u.userId}`); }}>
                  <div className="search-avatar">
                    {u.profilePictureUrl ? <img src={u.profilePictureUrl} alt="" /> : <div className="search-avatar-ph" />}
                  </div>
                  <div className="search-user-info">
                    <p className="search-username">@{u.username}</p>
                    <p className="search-streak">{u.bio || `🔥 ${u.streakCount} day streak`}</p>
                  </div>
                  <span className="search-chevron">›</span>
                </div>
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

      {/* Default — trending */}
      {showDefault && trending.length > 0 && (
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
