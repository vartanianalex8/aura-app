import { useState, useEffect } from 'react';
import { postService } from '../services/posts';
import { socialService } from '../services/social';
import { authService } from '../services/auth';
import PostCard from '../components/feed/PostCard';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Popular' },
];

// Rotates weekly based on the week number
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

export default function HomeScreen() {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const topic = getWeeklyTopic();
  const navigate = useNavigate();

  useEffect(() => {
    postService.cleanupExpiredPosts();
    // Seed UserIndex for existing users who signed up before this feature
    authService.seedUserIndex().catch(() => {});
  }, []);

  useEffect(() => {
    loadPosts();
  }, [sort]);

  const loadPosts = async () => {
    setLoading(true);
    setFeedError('');
    try {
      const data = await postService.getFeed({ sort });
      setPosts(data);
    } catch (err) {
      console.error(err);
      setFeedError('Could not load posts. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

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
        </div>
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
      </header>

      {/* Topic of the Week */}
      <div className="topic-banner" onClick={() => navigate(`/hashtag/${topic.hashtag}`)}>
        <div className="topic-left">
          <span className="topic-badge">TOPIC OF THE WEEK</span>
          <h3 className="topic-title">{topic.emoji} {topic.topic}</h3>
          <p className="topic-desc">{topic.desc}</p>
        </div>
        <span className="topic-tag">#{topic.hashtag}</span>
      </div>

      <div className="feed">
        {loading ? (
          <div className="feed-empty">Loading your feed...</div>
        ) : feedError ? (
          <div className="feed-empty">
            <p className="feed-empty-title">⚠️ Something went wrong</p>
            <p className="feed-empty-sub">{feedError}</p>
            <button onClick={loadPosts} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '999px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>Retry</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty-title">No posts yet</p>
            <p className="feed-empty-sub">Be the first to share your moment</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.objectId} post={post} onDelete={loadPosts} />)
        )}
      </div>
    </div>
  );
}
