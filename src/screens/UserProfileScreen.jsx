import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, UserCheck, X } from 'lucide-react';
import { postService } from '../services/posts';
import { socialService } from '../services/social';
import { notificationService } from '../services/notifications';
import Parse from '../services/parse';
import { useAuth } from '../hooks/useAuth';
import { timeAgo, getTextPostFontSize } from '../utils/helpers';
import { REACTION_EMOJIS } from '../constants/config';
import './ProfileScreen.css';
import './UserProfileScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');

export default function UserProfileScreen() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);

  const isOwnProfile = currentUser?.objectId === userId;

  useEffect(() => {
    if (isOwnProfile) { navigate('/profile', { replace: true }); return; }
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const idxQuery = new Parse.Query(UserIndex);
      idxQuery.equalTo('userId', userId);
      const idx = await idxQuery.first();
      if (idx) {
        setProfileUser({
          objectId: userId,
          username: idx.get('username') || '',
          profilePictureUrl: idx.get('profilePictureUrl') || null,
          streakCount: idx.get('streakCount') || 0,
          longestStreak: idx.get('longestStreak') || 0,
          bio: idx.get('bio') || '',
        });
      }

      const posts = await postService.getUserPosts(userId);
      setAllPosts(posts);

      const [isFollowing, fc, fwc] = await Promise.all([
        socialService.isFollowing(userId).catch(() => false),
        socialService.getFollowerCount(userId).catch(() => 0),
        socialService.getFollowingCount(userId).catch(() => 0),
      ]);
      setFollowing(isFollowing);
      setFollowerCount(fc);
      setFollowingCount(fwc);
    } catch (err) {
      console.error('[Aura] Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (following) {
        await socialService.unfollow(userId);
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await socialService.follow(userId);
        setFollowing(true);
        setFollowerCount((c) => c + 1);
        notificationService.create({ toUserId: userId, type: 'follow' }).catch(() => {});
      }
    } catch (err) { console.error(err); }
    finally { setFollowLoading(false); }
  };

  if (loading) {
    return (
      <div className="profile-screen">
        <header className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
          <h2>Profile</h2>
        </header>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-screen">
        <header className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
          <h2>Profile</h2>
        </header>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>User not found</p>
      </div>
    );
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const postedToday = allPosts.some((p) => new Date(p.createdAt) >= today);

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
        <h2>@{profileUser.username}</h2>
        <div style={{ width: 36 }} />
      </header>

      <div className="profile-card">
        {/* Top row */}
        <div className="profile-top-row">
          <div className="profile-pic-wrap" style={{ borderColor: postedToday ? 'var(--accent)' : 'var(--border)' }}>
            {profileUser.profilePictureUrl
              ? <img src={profileUser.profilePictureUrl} alt="" className="profile-pic" />
              : <div className="profile-pic-placeholder" />}
          </div>

          <div className="profile-stats-col">
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-num">{allPosts.length}</span>
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

            <button
              className={`user-follow-btn ${following ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {following
                ? <><UserCheck size={14} /> Following</>
                : <><UserPlus size={14} /> Follow</>}
            </button>
          </div>
        </div>

        {/* Username, streak, bio */}
        <div className="profile-info-block">
          <p className="profile-name">@{profileUser.username}</p>
          <p className="profile-streak-badge">🔥 {profileUser.streakCount} day streak · best {profileUser.longestStreak}</p>
          {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
          {postedToday && <p className="posted-today-tag">✦ Posted today</p>}
        </div>
      </div>

      {/* Full post grid */}
      <div className="profile-grid">
        {allPosts.length === 0 ? (
          <p className="profile-loading">{profileUser.username} hasn't posted yet</p>
        ) : (
          allPosts.map((p) => (
            <div key={p.objectId} className="profile-grid-item" onClick={() => setSelectedPost(p)}>
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
              {selectedPost.caption && <p className="post-modal-caption">{selectedPost.caption}</p>}
              {selectedPost.hashtags?.length > 0 && (
                <p className="post-modal-tags">
                  {selectedPost.hashtags.map((t) => (
                    <span key={t} className="post-tag" onClick={() => { setSelectedPost(null); navigate(`/hashtag/${t}`); }}>#{t} </span>
                  ))}
                </p>
              )}
              <p className="post-modal-time">{timeAgo(selectedPost.createdAt)}</p>
              <div className="post-modal-reactions">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                  const count = selectedPost.reactionCounts?.[type] || 0;
                  return count > 0 ? <span key={type} className="post-modal-reaction">{emoji} {count}</span> : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
