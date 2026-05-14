import { useState, useEffect } from 'react';
import { commentService } from '../../services/comments';
import { notificationService } from '../../services/notifications';
import { timeAgo } from '../../utils/helpers';
import './CommentSection.css';

const MAX_WORDS = 50;

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export default function CommentSection({ postId, authorId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [hasCommented, setHasCommented] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [postId]);

  const load = async () => {
    try {
      const commented = await commentService.hasCommented(postId);
      setHasCommented(commented);
      if (commented) {
        const data = await commentService.getComments(postId);
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (countWords(text) > MAX_WORDS) {
      setError(`Keep it to ${MAX_WORDS} words or fewer`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await commentService.addComment(postId, text);
      if (authorId) {
        notificationService.create({ toUserId: authorId, type: 'comment', postId, message: text.slice(0, 40) }).catch(() => {});
      }
      setText('');
      setHasCommented(true);
      const data = await commentService.getComments(postId);
      setComments(data);
      onCommentAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (c) => {
    const parts = c.text?.split(/(@\w+)/g) || [];
    return parts.map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="comment-mention">{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  if (loading) return <div className="comments-loading">Loading...</div>;

  return (
    <div className="comments-section">
      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSubmit()}
          disabled={submitting}
        />
        <button className="comment-send" onClick={handleSubmit} disabled={submitting || !text.trim()}>
          {submitting ? '...' : 'Post'}
        </button>
      </div>

      {error && <p className="comment-error">{error}</p>}

      {!hasCommented ? (
        <div className="comment-gate">
          <span className="comment-gate-icon">💬</span>
          <p className="comment-gate-text">Drop your take to unlock the conversation</p>
        </div>
      ) : (
        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="comment-empty">Be the first to comment</p>
          ) : (
            comments.map((c) => (
              <div key={c.objectId} className="comment-item">
                <span className="comment-author">@{c.authorData?.username}</span>
                <span className="comment-text">{renderComment(c)}</span>
                <span className="comment-time">{timeAgo(c.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
