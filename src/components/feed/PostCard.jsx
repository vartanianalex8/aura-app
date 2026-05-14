import { useState, useEffect, useRef } from 'react';
import { Trash2, MoreHorizontal, Bookmark, BookmarkCheck, Pencil, SmilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { REACTION_EMOJIS } from '../../constants/config';
import { timeAgo, getTotalReactions, getDominantReaction } from '../../utils/helpers';
import { postService } from '../../services/posts';
import { socialService } from '../../services/social';
import { notificationService } from '../../services/notifications';
import { useAuth } from '../../hooks/useAuth';
import CommentSection from './CommentSection';
import './PostCard.css';

export default function PostCard({ post, onDelete }) {
  const [counts, setCounts] = useState(post.reactionCounts || {});
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(socialService.isPostSaved(post.objectId));
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const reactionPanelRef = useRef(null);

  const author = post.authorData || {};

  useEffect(() => {
    if (post.userReaction === undefined) {
      postService.getUserReaction(post.objectId)
        .then((type) => { if (type) setUserReaction(type); })
        .catch(() => {});
    }
  }, [post.objectId]);

  // Close reaction panel on outside click
  useEffect(() => {
    if (!showReactions) return;
    const handler = (e) => {
      if (reactionPanelRef.current && !reactionPanelRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showReactions]);

  const profilePic = author.profilePicture?.url || author.profilePicture;
  const total = getTotalReactions(counts);
  const dominant = getDominantReaction(counts);
  const isOwner = user?.objectId === author.objectId;
  const statusEmoji = author.status ? { online: '🟢', away: '🟡', dnd: '🔴', offline: '⚫' }[author.status] : null;

  // Only show expiry when < 6 hours remain
  const getTimeRemaining = () => {
    const created = new Date(post.createdAt).getTime();
    const expiresAt = created + 24 * 60 * 60 * 1000;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours >= 6) return null; // don't show if plenty of time left
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };
  const timeRemaining = getTimeRemaining();

  const handleReact = async (type) => {
    setShowReactions(false);
    try {
      const result = await postService.react(post.objectId, type);
      setCounts(result.counts);
      setUserReaction(result.userReaction);
      // Notify post author if we added a reaction (not removed)
      if (result.userReaction && author.objectId) {
        notificationService.create({
          toUserId: author.objectId,
          type: 'reaction',
          postId: post.objectId,
        }).catch(() => {});
      }
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
      if (saved) { await socialService.unsavePost(post.objectId); setSaved(false); }
      else { await socialService.savePost(post.objectId); setSaved(true); }
    } catch (err) { console.error(err); }
  };

  const handleEdit = async () => {
    try {
      await postService.editPost(post.objectId, { caption: editCaption });
      post.caption = editCaption;
      setEditing(false);
      setShowMenu(false);
    } catch (err) { alert(err.message); }
  };

  const handleTagClick = (tag) => navigate(`/hashtag/${tag}`);

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
          <span className="post-time">
            {timeAgo(post.createdAt)}
            {timeRemaining && <span className="post-expiry"> · ⏳ {timeRemaining}</span>}
          </span>
        </div>
        <div className="post-actions-right">
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
        post.caption && <p className="post-caption">{post.caption}</p>
      )}

      {post.hashtags?.length > 0 && (
        <div className="post-tags">
          {post.hashtags.map((tag) => (
            <span key={tag} className="post-tag" onClick={() => handleTagClick(tag)}>#{tag}</span>
          ))}
        </div>
      )}

      {post.location && <p className="post-location">📍 {post.location}</p>}

      {/* Reaction bar — compact with expand panel */}
      <div className="post-reactions">
        <div className="reaction-summary-row">
          {/* Current reaction or dominant */}
          <div className="reaction-left">
            {total > 0 && (
              <span className="reaction-summary-pill">
                {userReaction ? REACTION_EMOJIS[userReaction] : dominant ? REACTION_EMOJIS[dominant] : ''}
                {' '}{total}
              </span>
            )}
          </div>
          <div className="reaction-actions">
            <div className="reaction-trigger-wrap" ref={reactionPanelRef}>
              <button
                className={`reaction-trigger-btn ${userReaction ? 'reacted' : ''}`}
                onClick={() => setShowReactions((v) => !v)}
              >
                {userReaction ? (
                  <span>{REACTION_EMOJIS[userReaction]}</span>
                ) : (
                  <SmilePlus size={18} />
                )}
                <span className="reaction-trigger-label">{userReaction ? 'Reacted' : 'React'}</span>
              </button>
              {showReactions && (
                <div className="reaction-panel">
                  {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                    <button
                      key={type}
                      className={`reaction-panel-btn ${userReaction === type ? 'active' : ''}`}
                      onClick={() => handleReact(type)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="comment-action-btn" onClick={() => setShowComments(!showComments)}>
              💬 <span>{commentCount}</span>
            </button>
          </div>
        </div>
      </div>

      {showComments && <CommentSection postId={post.objectId} authorId={author.objectId} onCommentAdded={() => setCommentCount(c => c + 1)} />}
    </article>
  );
}
