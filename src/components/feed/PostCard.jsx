import { useState, useEffect } from 'react';
import { Trash2, MoreHorizontal, Bookmark, BookmarkCheck, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { REACTION_EMOJIS, POST_CATEGORIES } from '../../constants/config';
import { timeAgo, getTotalReactions, getDominantReaction } from '../../utils/helpers';
import { postService } from '../../services/posts';
import { socialService } from '../../services/social';
import { useAuth } from '../../hooks/useAuth';
import CommentSection from './CommentSection';
import './PostCard.css';

export default function PostCard({ post, onDelete }) {
  const [counts, setCounts] = useState(post.reactionCounts || {});
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(socialService.isPostSaved(post.objectId));
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const { user } = useAuth();
  const navigate = useNavigate();

  const author = post.authorData || {};

  // For posts loaded outside the feed (profile, saved), userReaction isn't pre-populated.
  // Fetch it once on mount in that case.
  useEffect(() => {
    if (post.userReaction === undefined) {
      postService.getUserReaction(post.objectId)
        .then((type) => { if (type) setUserReaction(type); })
        .catch(() => {});
    }
  }, [post.objectId]);
  const profilePic = author.profilePicture?.url || author.profilePicture;
  const total = getTotalReactions(counts);
  const dominant = getDominantReaction(counts);
  const isOwner = user?.objectId === author.objectId;
  const category = POST_CATEGORIES.find((c) => c.value === post.category);
  const statusEmoji = author.status ? { online: '🟢', away: '🟡', dnd: '🔴', offline: '⚫' }[author.status] : null;

  const getTimeRemaining = () => {
    const created = new Date(post.createdAt).getTime();
    const expiresAt = created + 24 * 60 * 60 * 1000;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleReact = async (type) => {
    try {
      const result = await postService.react(post.objectId, type);
      setCounts(result.counts);
      setUserReaction(result.userReaction);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await postService.deletePost(post.objectId);
      onDelete?.();
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await socialService.unsavePost(post.objectId);
        setSaved(false);
      } else {
        await socialService.savePost(post.objectId);
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async () => {
    try {
      await postService.editPost(post.objectId, { caption: editCaption });
      post.caption = editCaption;
      setEditing(false);
      setShowMenu(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/hashtag/${tag}`);
  };

  return (
    <article className={`post-card ${deleting ? 'post-card--deleting' : ''}`}>
      <div className="post-header">
        <div className="post-avatar">
          {profilePic ? <img src={profilePic} alt="" /> : <div className="post-avatar-placeholder" />}
          {statusEmoji && <span className="post-status-dot">{statusEmoji}</span>}
        </div>
        <div className="post-meta">
          <span
            className="post-username"
            onClick={(e) => { e.stopPropagation(); if (author.objectId) navigate(`/user/${author.objectId}`); }}
            style={{ cursor: 'pointer' }}
          >
            @{author.username || 'unknown'}
          </span>
          <span className="post-time">{timeAgo(post.createdAt)} · <span className="post-expiry">⏳ {getTimeRemaining()}</span></span>
        </div>
        <div className="post-actions-right">
          {category && <span className="post-category-badge" title={category.label}>{category.emoji}</span>}
          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
          {isOwner && (
            <div className="post-menu-wrap">
              <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="post-menu">
                  <button className="post-menu-item" onClick={() => { setEditing(true); setShowMenu(false); }}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="post-menu-item post-menu-item--danger" onClick={handleDelete}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {post.image && (
        <div className="post-image">
          <img src={post.image.url} alt="" />
        </div>
      )}

      {editing ? (
        <div className="post-edit-wrap">
          <textarea
            className="post-edit-input"
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            maxLength={1000}
          />
          <div className="post-edit-actions">
            <button className="post-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
            <button className="post-edit-save" onClick={handleEdit}>Save</button>
          </div>
        </div>
      ) : (
        <>
          {post.caption && <p className="post-caption">{post.caption}</p>}
        </>
      )}

      {post.hashtags?.length > 0 && (
        <div className="post-tags">
          {post.hashtags.map((tag) => (
            <span key={tag} className="post-tag" onClick={() => handleTagClick(tag)}>#{tag}</span>
          ))}
        </div>
      )}

      {post.location && <p className="post-location">📍 {post.location}</p>}

      <div className="post-reactions">
        <div className="reaction-btns">
          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
            const count = counts[type] || 0;
            return (
              <button
                key={type}
                className={`reaction-btn ${userReaction === type ? 'active' : ''}`}
                onClick={() => handleReact(type)}
              >
                {emoji}
                {count > 0 && <span className="reaction-btn-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <button className="comment-toggle" onClick={() => setShowComments(!showComments)}>
        💬 {commentCount} comments
      </button>

      {showComments && <CommentSection postId={post.objectId} onCommentAdded={() => setCommentCount(c => c + 1)} />}
    </article>
  );
}
