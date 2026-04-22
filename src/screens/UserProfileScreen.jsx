import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, UserPlus, UserCheck } from 'lucide-react';
import { postService } from '../services/posts';
import { socialService } from '../services/social';
import Parse from '../services/parse';
import { useAuth } from '../hooks/useAuth';
import { timeAgo } from '../utils/helpers';
import '../screens/ProfileScreen.css';
import '../screens/UserProfileScreen.css';
import './UserProfileScreen.css';

const UserIndex = Parse.Object.extend('UserIndex');

export default function UserProfileScreen() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [todayPost, setTodayPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const isOwnProfile = currentUser?.objectId === userId;

  useEffect(() => {
    if (isOwnProfile) { navigate('/profile', { replace: true }); return; }
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Load user info from UserIndex (public read — no CLP issues)
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

      // Load posts (uses pointer, no _User fetch needed)
      const posts = await postService.getUserPosts(userId);
      setAllPosts(posts);

      // Find today's post
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todays = posts.find((p) => new Date(p.createdAt) >= today);
      setTodayPost(todays || null);

      // Follow state + follower count
      const [isFollowing, fc] = await Promise.all([
        socialService.isFollowing(userId).catch(() => false),
        socialService.getFollowerCount(userId).catch(() => 0),
      ]);
      setFollowing(isFollowing);
      setFollowerCount(fc);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
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

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
        <h2>{profileUser.username}</h2>
      </header>

      {/* Profile card */}
      <div className="user-profile-card">
        <div className="user-profile-avatar-wrap">
          {profileUser.profilePictureUrl
            ? <img src={profileUser.profilePictureUrl} alt="" className="profile-pic" />
            : <div className="profile-pic-placeholder" />}
        </div>

        <div className="user-profile-info">
          <p className="user-profile-username">{profileUser.username}</p>
          {profileUser.bio && <p className="user-profile-bio">{profileUser.bio}</p>}
          <div className="user-profile-stats">
            <span><Flame size={13} /> {profileUser.streakCount} day streak</span>
            <span>· {followerCount} followers</span>
            <span>· {allPosts.length} posts</span>
          </div>
        </div>

        <button
          className={`profile-follow-btn ${following ? 'following' : ''}`}
          onClick={handleFollow}
          disabled={followLoading}
          style={{ marginTop: '0.75rem', alignSelf: 'stretch' }}
        >
          {following ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
        </button>
      </div>

      {/* Today's post */}
      <div className="user-profile-today">
        <h3 className="user-profile-section-title">Today's moment</h3>
        {todayPost ? (
          <div className="user-profile-post">
            {todayPost.image && (
              <div className="user-profile-post-img">
                <img src={todayPost.image.url} alt="" />
              </div>
            )}
            {todayPost.caption && (
              <p className="user-profile-post-caption">{todayPost.caption}</p>
            )}
            {todayPost.hashtags?.length > 0 && (
              <div className="user-profile-post-tags">
                {todayPost.hashtags.map((t) => (
                  <span key={t} className="post-tag" onClick={() => navigate(`/hashtag/${t}`)}>#{t}</span>
                ))}
              </div>
            )}
            <p className="user-profile-post-time">{timeAgo(todayPost.createdAt)}</p>
          </div>
        ) : (
          <p className="user-profile-no-post">
            {profileUser.username} hasn't posted today yet
          </p>
        )}
      </div>
    </div>
  );
}
