import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { postService } from '../services/posts';
import { socialService } from '../services/social';
import { authService } from '../services/auth';
import { ROUTES } from '../constants/routes';
import { REACTION_EMOJIS } from '../constants/config';
import { timeAgo, getTextPostFontSize } from '../utils/helpers';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editUsername, setEditUsername] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [editingCaption, setEditingCaption] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadPosts(); loadSocialCounts(); }, [user]);

  const loadPosts = async () => {
    if (!user?.objectId) return;
    try {
      const data = await postService.getUserPosts(user.objectId);
      setPosts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSocialCounts = async () => {
    if (!user?.objectId) return;
    try {
      const [fc, fwc] = await Promise.all([
        socialService.getFollowerCount(user.objectId).catch(() => 0),
        socialService.getFollowingCount(user.objectId).catch(() => 0),
      ]);
      setFollowerCount(fc);
      setFollowingCount(fwc);
    } catch (err) { console.error(err); }
  };

  const handleEdit = async (postId) => {
    try {
      await postService.editPost(postId, { caption: editingCaption });
      setSelectedPost((p) => ({ ...p, caption: editingCaption }));
      setPosts((prev) => prev.map((p) => p.objectId === postId ? { ...p, caption: editingCaption } : p));
      setEditMode(false);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await postService.deletePost(postId);
      setSelectedPost(null);
      loadPosts();
    } catch (err) { alert(err.message); }
  };

  const openPost = (p) => { setSelectedPost(p); setEditingCaption(p.caption || ''); setEditMode(false); };

  const handleSaveProfile = async () => {
    setEditMsg('');
    try {
      const updates = {};
      if (editUsername.trim()) {
        if (editUsername.length > 15) { setEditMsg('Username must be 15 chars or fewer'); return; }
        updates.username = editUsername.trim();
      }
      if (editBio !== (user?.bio || '')) updates.bio = editBio.trim();
      if (Object.keys(updates).length > 0) await authService.updateProfile(updates);
      if (profilePicFile) {
        await authService.uploadProfilePicture(profilePicFile);
        setProfilePicFile(null);
      }
      await refreshUser();
      setEditMsg('Profile updated!');
      setEditUsername('');
      setTimeout(() => { setEditMsg(''); setShowEditProfile(false); }, 1500);
    } catch (err) { setEditMsg(err.message || 'Failed to update profile'); }
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

      {/* Profile card — Instagram layout */}
      <div className="profile-card">
        {/* Top row: avatar + stats */}
        <div className="profile-top-row">
          <div className="profile-pic-wrap">
            {profilePic
              ? <img src={profilePic} alt="" className="profile-pic" />
              : <div className="profile-pic-placeholder" />}
          </div>
          <div className="profile-stats-col">
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-num">{posts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-num">{followerCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-num">{followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
            <button className="edit-profile-btn" onClick={() => { setEditBio(user?.bio || ''); setShowEditProfile(true); }}>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Username, streak, bio */}
        <div className="profile-info-block">
          <p className="profile-name">@{user?.username}</p>
          <p className="profile-streak-badge">🔥 {user?.streakCount || 0} day streak · best {user?.longestStreak || 0}</p>
          {user?.bio && <p className="profile-bio">{user.bio}</p>}
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
              {p.image
                ? <img src={p.image.url} alt="" />
                : <div className="profile-text-post"><span className="profile-text-post-inner" style={{ fontSize: getTextPostFontSize(p.caption) }}>{p.caption?.slice(0, 120)}</span></div>}
            </div>
          ))
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="post-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="post-modal-close" onClick={() => setSelectedPost(null)}><X size={20} /></button>
            {selectedPost.image && <div className="post-modal-img"><img src={selectedPost.image.url} alt="" /></div>}
            <div className="post-modal-body">
              {editMode ? (
                <>
                  <textarea className="post-edit-input" value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} maxLength={1000} rows={4} style={{ width: '100%', marginBottom: '0.5rem' }} />
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
              {selectedPost.hashtags?.length > 0 && <p className="post-modal-tags">{selectedPost.hashtags.map((t) => <span key={t} className="post-tag">#{t} </span>)}</p>}
              <p className="post-modal-time">{timeAgo(selectedPost.createdAt)}</p>
              <div className="post-modal-reactions">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                  const count = selectedPost.reactionCounts?.[type] || 0;
                  return count > 0 ? <span key={type} className="post-modal-reaction">{emoji} {count}</span> : null;
                })}
              </div>
              <button className="post-modal-delete" onClick={() => handleDelete(selectedPost.objectId)}>Delete Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile modal */}
      {showEditProfile && (
        <div className="post-modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="post-modal edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="post-modal-close" onClick={() => setShowEditProfile(false)}><X size={20} /></button>
            <h3 className="edit-profile-title">Edit Profile</h3>
            {editMsg && <p className="edit-profile-msg">{editMsg}</p>}

            <label className="edit-profile-label">Profile Picture</label>
            <div className="edit-profile-pic-row">
              {(profilePicFile ? URL.createObjectURL(profilePicFile) : profilePic) ? (
                <img src={profilePicFile ? URL.createObjectURL(profilePicFile) : profilePic} alt="" className="edit-profile-pic-preview" />
              ) : <div className="edit-profile-pic-placeholder" />}
              <label className="edit-profile-pic-btn">
                Change photo
                <input type="file" accept="image/*" hidden onChange={(e) => setProfilePicFile(e.target.files[0])} />
              </label>
            </div>

            <label className="edit-profile-label">Username</label>
            <input className="settings-input" placeholder={`@${user?.username}`} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} maxLength={15} />

            <label className="edit-profile-label">Bio</label>
            <textarea className="settings-input" placeholder="Write something about yourself..." value={editBio} onChange={(e) => setEditBio(e.target.value)} maxLength={150} rows={3} style={{ resize: 'none' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', display: 'block' }}>{editBio.length}/150</span>

            <button className="auth-btn" style={{ marginTop: '1rem' }} onClick={handleSaveProfile}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
