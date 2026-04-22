import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { socialService } from '../services/social';
import PostCard from '../components/feed/PostCard';
import './SavedScreen.css';

export default function SavedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await socialService.getSavedPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saved-screen">
      <header className="saved-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2>Saved Posts</h2>
      </header>

      {loading ? (
        <p className="saved-empty">Loading saved posts...</p>
      ) : posts.length === 0 ? (
        <div className="saved-empty">
          <p className="saved-empty-title">No saved posts yet</p>
          <p>Bookmark posts from the feed to see them here</p>
        </div>
      ) : (
        <div className="saved-feed">
          {posts.map((post) => (
            <PostCard key={post.objectId} post={post} onDelete={load} />
          ))}
        </div>
      )}
    </div>
  );
}
