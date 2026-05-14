import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Hash } from 'lucide-react';
import { postService } from '../services/posts';
import Parse from '../services/parse';
import PostCard from '../components/feed/PostCard';
import './HashtagScreen.css';

export default function HashtagScreen() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { load(); }, [tag]);

  const load = async () => {
    setLoading(true);
    try {
      const Post = Parse.Object.extend('Post');
      const query = new Parse.Query(Post);
      query.equalTo('hashtags', tag.toLowerCase());
      query.descending('createdAt');
      query.include('author');
      query.limit(50);
      const results = await query.find();
      // Use _enrichPosts so reaction counts, comment counts and user reactions all load correctly
      const currentUser = Parse.User.current();
      const enriched = await postService._enrichPosts(results, currentUser);
      setPosts(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hashtag-screen">
      <header className="hashtag-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <div className="hashtag-title-wrap">
          <Hash size={20} />
          <h2>{tag}</h2>
        </div>
      </header>

      <p className="hashtag-count">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <p className="hashtag-loading">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="hashtag-loading">No posts with #{tag}</p>
      ) : (
        <div className="hashtag-feed">
          {posts.map((post) => (
            <PostCard key={post.objectId} post={post} onDelete={load} />
          ))}
        </div>
      )}
    </div>
  );
}
