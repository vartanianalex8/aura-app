import { useState, useEffect, useCallback, useRef } from 'react';
import { postService } from '../services/posts';
import { authService } from '../services/auth';
import PostCard from '../components/feed/PostCard';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { RefreshCw, Menu } from 'lucide-react';
import './HomeScreen.css';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Popular' },
];

const WEEKLY_TOPICS = [
  { emoji: '🌅', topic: 'Golden Hour', hashtag: 'goldenhour', desc: 'Capture the magic of sunrise or sunset' },
  { emoji: '🍽️', topic: 'Comfort Food', hashtag: 'comfortfood', desc: 'Share your favorite meal this week' },
  { emoji: '📚', topic: 'Currently Reading', hashtag: 'reading', desc: 'What book is on your nightstand?' },
  { emoji: '🎵', topic: 'Song of the Week', hashtag: 'songoftheweek', desc: 'What track is on repeat?' },
  { emoji: '🌿', topic: 'Touch Grass', hashtag: 'touchgrass', desc: 'Show us your outdoor moment' },
  { emoji: '💭', topic: 'Shower Thought', hashtag: 'showerthought', desc: 'Share a random realization' },
  { emoji: '🏋️', topic: 'Personal Best', hashtag: 'personalbest', desc: 'Celebrate a small win' },
  { emoji: '🎨', topic: 'Something Beautiful', hashtag: 'beauty', desc: 'What caught your eye today?' },
];

function getWeeklyTopic() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_TOPICS[week % WEEKLY_TOPICS.length];
}

const PAGE_SIZE = 15;

export default function HomeScreen() {
  const { onMenuOpen } = useOutletContext() || {};
  const [feedTab, setFeedTab] = useState('forYou');
  const [sort, setSort] = useState('recent');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followingEmpty, setFollowingEmpty] = useState(false);
  const topic = getWeeklyTopic();
  const navigate = useNavigate();
  const loaderRef = useRef(null);
  const skipRef = useRef(0);

  useEffect(() => {
    postService.cleanupExpiredPosts();
    authService.seedUserIndex().catch(() => {});
  }, []);

  const loadPosts = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setFeedError('');
    const skip = reset ? 0 : skipRef.current;
    try {
      let data;
      if (feedTab === 'following') {
        data = await postService.getFollowingFeed({ skip, limit: PAGE_SIZE });
        if (reset && data.length === 0) setFollowingEmpty(true);
        else setFollowingEmpty(false);
      } else {
        data = await postService.getFeed({ sort, skip, limit: PAGE_SIZE });
      }
      if (data.length < PAGE_SIZE) setHasMore(false);
      skipRef.current = skip + data.length;
      if (reset) setPosts(data);
      else setPosts((prev) => [...prev, ...data]);
    } catch (err) {
      console.error(err);
      setFeedError('Could not load posts. Tap to retry.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [feedTab, sort]);

  useEffect(() => {
    skipRef.current = 0;
    setPosts([]);
    setHasMore(true);
    setFollowingEmpty(false);
    loadPosts(true);
  }, [feedTab, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    skipRef.current = 0;
    setHasMore(true);
    setFollowingEmpty(false);
    try {
      let data;
      if (feedTab === 'following') {
        data = await postService.getFollowingFeed({ skip: 0, limit: PAGE_SIZE });
        if (data.length === 0) setFollowingEmpty(true);
      } else {
        data = await postService.getFeed({ sort, skip: 0, limit: PAGE_SIZE });
      }
      if (data.length < PAGE_SIZE) setHasMore(false);
      skipRef.current = data.length;
      setPosts(data);
    } catch {
      setFeedError('Could not refresh. Try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadPosts]);

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="home-logo-row">
          <svg className="home-logo-icon" viewBox="0 0 32 32" width="28" height="28">
            <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2"/>
            <circle cx="16" cy="16" r="6" fill="var(--accent)" opacity="0.6"/>
            <circle cx="16" cy="16" r="2" fill="var(--accent)"/>
          </svg>
          <span className="home-logo-text">Aura</span>
          <button
            className={`home-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh feed"
          >
            <RefreshCw size={16} />
          </button>
          <button className="home-menu-btn" onClick={onMenuOpen} title="More">
            <Menu size={20} />
          </button>
        </div>

        <div className="feed-tabs">
          <button className={`feed-tab ${feedTab === 'forYou' ? 'active' : ''}`} onClick={() => setFeedTab('forYou')}>
            For You
          </button>
          <button className={`feed-tab ${feedTab === 'following' ? 'active' : ''}`} onClick={() => setFeedTab('following')}>
            Following
          </button>
        </div>

        {feedTab === 'forYou' && (
          <div className="home-filters">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`filter-chip ${sort === opt.value ? 'active' : ''}`}
                onClick={() => setSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {feedTab === 'forYou' && (
        <div className="topic-banner" onClick={() => navigate(`/hashtag/${topic.hashtag}`)}>
          <div className="topic-left">
            <span className="topic-badge">TOPIC OF THE WEEK</span>
            <h3 className="topic-title">{topic.emoji} {topic.topic}</h3>
            <p className="topic-desc">{topic.desc}</p>
          </div>
          <span className="topic-tag">#{topic.hashtag}</span>
        </div>
      )}

      <div className="feed">
        {loading ? (
          <div className="feed-empty">Loading your feed...</div>
        ) : feedError ? (
          <div className="feed-empty">
            <p className="feed-empty-title">⚠️ Something went wrong</p>
            <p className="feed-empty-sub">{feedError}</p>
            <button onClick={() => loadPosts(true)} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '999px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>Retry</button>
          </div>
        ) : feedTab === 'following' && followingEmpty ? (
          <div className="feed-empty">
            <p className="feed-empty-title">No moments yet</p>
            <p className="feed-empty-sub">Follow some people to see their daily moments here</p>
            <button onClick={() => navigate('/search')} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '999px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>Find people</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty-title">No posts yet</p>
            <p className="feed-empty-sub">Be the first to share your moment</p>
          </div>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post.objectId} post={post} onDelete={() => loadPosts(true)} />)}
            <div ref={loaderRef} style={{ height: 1 }} />
            {loadingMore && <div className="feed-loading-more">Loading more...</div>}
            {!hasMore && posts.length > 0 && <div className="feed-end">You're all caught up ✨</div>}
          </>
        )}
      </div>
    </div>
  );
}
