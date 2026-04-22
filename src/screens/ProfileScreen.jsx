import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Flame, Award, X, Grid3x3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { postService } from '../services/posts';
import { ROUTES } from '../constants/routes';
import { REACTION_EMOJIS } from '../constants/config';
import { timeAgo, getTotalReactions, getDominantReaction } from '../utils/helpers';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { user, logOut } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    if (!user?.objectId) return;
    try {
      const data = await postService.getUserPosts(user.objectId);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [editingCaption, setEditingCaption] = useState('');
  const [editMode, setEditMode] = useState(false);

  const handleEdit = async (postId) => {
    try {
      await postService.editPost(postId, { caption: editingCaption });
      setSelectedPost((p) => ({ ...p, caption: editingCaption }));
      setPosts((prev) => prev.map((p) => p.objectId === postId ? { ...p, caption: editingCaption } : p));
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const openPost = (p) => {
    setSelectedPost(p);
    setEditingCaption(p.caption || '');
    setEditMode(false);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postService.deletePost(postId);
      setSelectedPost(null);
      loadPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const profilePic = user?.profilePicture?.url;

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <h2>Profile</h2>
        <button className="settings-btn" onClick={() => navigate(ROUTES.SETTINGS)}>
          <Settings size={20} />
        </button>
      </header>

      <div className="profile-card">
        <div className="profile-pic-wrap">
          {profilePic ? (
            <img src={profilePic} alt="" className="profile-pic" />
          ) : (
            <div className="profile-pic-placeholder" />
          )}
        </div>
        <h3 className="profile-name">@{user?.username}</h3>
        {user?.bio && <p className="profile-bio">{user.bio}</p>}

        <div className="profile-stats">
          <div className="stat">
            <Flame size={16} />
            <span className="stat-num">{user?.streakCount || 0}</span>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat">
            <Award size={16} />
            <span className="stat-num">{user?.longestStreak || 0}</span>
            <span className="stat-label">Best</span>
          </div>
          <div className="stat">
            <Grid3x3 size={16} />
            <span className="stat-num">{posts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="profile-grid">
        {loading ? (
          <p className="profile-loading">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="profile-loading">No posts yet</p>
        ) : (
          posts.map((p) => (
            <div key={p.objectId} className="profile-grid-item" onClick={() => openPost(p)}>
              {p.image ? (
                <img src={p.image.url} alt="" />
              ) : (
                <div className="profile-text-post">{p.caption?.slice(0, 50)}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="post-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="post-modal-close" onClick={() => setSelectedPost(null)}>
              <X size={20} />
            </button>
            {selectedPost.image && (
              <div className="post-modal-img">
                <img src={selectedPost.image.url} alt="" />
              </div>
            )}
            <div className="post-modal-body">
              {editMode ? (
                <>
                  <textarea
                    className="post-edit-input"
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="post-edit-cancel" onClick={() => setEditMode(false)}>Cancel</button>
                    <button className="post-edit-save" onClick={() => handleEdit(selectedPost.objectId)}>Save</button>
                  </div>
                </>
              ) : (
                <>
                  {selectedPost.caption && <p className="post-modal-caption">{selectedPost.caption}</p>}
                  <button className="post-modal-edit" onClick={() => setEditMode(true)}>✏️ Edit caption</button>
                </>
              )}
              {selectedPost.hashtags?.length > 0 && (
                <p className="post-modal-tags">
                  {selectedPost.hashtags.map((t) => <span key={t} className="post-tag">#{t} </span>)}
                </p>
              )}
              <p className="post-modal-time">{timeAgo(selectedPost.createdAt)}</p>
              <div className="post-modal-reactions">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                  const count = selectedPost.reactionCounts?.[type] || 0;
                  return count > 0 ? (
                    <span key={type} className="post-modal-reaction">
                      {emoji} {count}
                    </span>
                  ) : null;
                })}
              </div>
              <button className="post-modal-delete" onClick={() => handleDelete(selectedPost.objectId)}>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="logout-btn" onClick={logOut}>Log Out</button>
    </div>
  );
}
