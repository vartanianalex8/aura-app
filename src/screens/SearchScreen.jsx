import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, X, Users, FileText } from 'lucide-react';
import Parse from '../services/parse';
import { socialService } from '../services/social';
import './SearchScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');
const Post = Parse.Object.extend('Post');

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('people'); // 'people' | 'posts'
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    socialService.getTrendingHashtags(8).then(setTrending).catch(() => {});
  }, []);

  // Re-run search when tab switches (if there's already a query)
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
          } catch (e) { console.warn('[Aura] Search fallback failed:', e.message); }
        }
        setUsers(found.map((u) => ({
          userId: u.get('userId'),
          username: u.get('username') || '',
          streakCount: u.get('streakCount') || 0,
          profilePictureUrl: u.get('profilePictureUrl') || null,
          bio: u.get('bio') || '',
        })));
      } catch (err) {
        console.error('[Aura] User search error:', err);
      }
    } else {
      // Post search — match caption or hashtags
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const clean = term.trim().toLowerCase().replace(/^#/, '');

        // Search by hashtag
        const tagQuery = new Parse.Query(Post);
        tagQuery.equalTo('hashtags', clean);
        tagQuery.greaterThan('createdAt', cutoff);
        tagQuery.descending('createdAt');
        tagQuery.limit(20);

        // Search by caption (starts-with, case-sensitive is a Parse limitation)
        const captionQuery = new Parse.Query(Post);
        captionQuery.matches('caption', new RegExp(clean, 'i'));
        captionQuery.greaterThan('createdAt', cutoff);
        captionQuery.descending('createdAt');
        captionQuery.limit(20);

        let results = [];
        try {
          const combined = Parse.Query.or(tagQuery, captionQuery);
          combined.descending('createdAt');
          combined.limit(30);
          results = await combined.find();
        } catch {
          // fallback to tag-only if combined fails
          results = await tagQuery.find();
        }

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
      } catch (err) {
        console.error('[Aura] Post search error:', err);
      }
    }

    setLoading(false);
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setUsers([]); setPosts([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => runSearch(val, tab), 300);
  };

  const clearSearch = () => { setQuery(''); setUsers([]); setPosts([]); setSearched(false); };

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
          onKeyDown={(e) => e.key === 'Enter' && runSearch(query, tab)}
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

      {/* Results */}
      {searched ? (
        <div className="search-results">
          {loading && <div className="search-status">Searching...</div>}

          {!loading && tab === 'people' && (
            users.length === 0
              ? <div className="search-empty"><p>No people found for "{query}"</p></div>
              : users.map((u) => (
                <div key={u.userId} className="search-user-row" onClick={() => navigate(`/user/${u.userId}`)}>
                  <div className="search-avatar">
                    {u.profilePictureUrl
                      ? <img src={u.profilePictureUrl} alt="" />
                      : <div className="search-avatar-ph" />}
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
                        : <div className="search-post-thumb search-post-thumb--text">✦</div>
                      }
                      <div className="search-post-info">
                        <p className="search-post-author">@{p.authorUsername}</p>
                        {p.caption && <p className="search-post-caption">{p.caption.slice(0, 80)}{p.caption.length > 80 ? '…' : ''}</p>}
                        {p.hashtags.length > 0 && (
                          <p className="search-post-tags">{p.hashtags.slice(0, 3).map(t => `#${t}`).join(' ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          )}
        </div>
      ) : (
        /* Default — trending hashtags */
        trending.length > 0 && (
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
        )
      )}
    </div>
  );
}
