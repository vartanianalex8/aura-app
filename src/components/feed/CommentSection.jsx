import { useState, useEffect, useRef } from 'react';
import { CornerDownRight } from 'lucide-react';
import { commentService } from '../../services/comments';
import { notificationService } from '../../services/notifications';
import { timeAgo } from '../../utils/helpers';
import './CommentSection.css';

const MAX_WORDS = 50;
function countWords(str) { return str.trim().split(/\s+/).filter(Boolean).length; }

function renderText(text) {
  const parts = (text || '').split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? <span key={i} className="comment-mention">{part}</span> : <span key={i}>{part}</span>
  );
}

function CommentItem({ c, onReply, depth = 0 }) {
  const replies = c.replies || [];
  const [showReplies, setShowReplies] = useState(false);
  return (
    <div className={'comment-item' + (depth > 0 ? ' comment-item--reply' : '')}>
      <div className="comment-main">
        <div className="comment-bubble">
          <span className="comment-author">@{c.authorData?.username}</span>
          <span className="comment-text"> {renderText(c.text)}</span>
        </div>
        <div className="comment-meta-row">
          <span className="comment-time">{timeAgo(c.createdAt)}</span>
          {depth === 0 && (
            <button className="comment-reply-btn" onClick={() => onReply(c)}>
              Reply
            </button>
          )}
          {replies.length > 0 && depth === 0 && (
            <button className="comment-show-replies-btn" onClick={() => setShowReplies(v => !v)}>
              <CornerDownRight size={12} />
              {showReplies ? 'Hide' : `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`}
            </button>
          )}
        </div>
      </div>
      {showReplies && replies.length > 0 && (
        <div className="comment-replies">
          {replies.map(r => (
            <CommentItem key={r.objectId} c={r} onReply={() => {}} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, authorId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [hasCommented, setHasCommented] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { objectId, authorData }
  const inputRef = useRef(null);

  useEffect(() => { load(); }, [postId]);

  const load = async () => {
    try {
      const commented = await commentService.hasCommented(postId);
      setHasCommented(commented);
      if (commented) {
        const data = await commentService.getComments(postId);
        setComments(buildThreaded(data));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Build parent→children tree
  const buildThreaded = (flat) => {
    const map = {};
    flat.forEach(c => { map[c.objectId] = { ...c, replies: [] }; });
    const roots = [];
    flat.forEach(c => {
      const parentId = c.parent?.objectId;
      if (parentId && map[parentId]) map[parentId].replies.push(map[c.objectId]);
      else roots.push(map[c.objectId]);
    });
    return roots;
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setText('@' + (comment.authorData?.username || '') + ' ');
    inputRef.current?.focus();
  };

  const cancelReply = () => { setReplyingTo(null); setText(''); };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (countWords(text) > MAX_WORDS) { setError(`Keep it to ${MAX_WORDS} words or fewer`); return; }
    setError('');
    setSubmitting(true);
    try {
      await commentService.addComment(postId, text, replyingTo?.objectId || null);
      if (authorId) notificationService.create({ toUserId: authorId, type: 'comment', postId, message: text.slice(0, 40) }).catch(() => {});
      setText('');
      setReplyingTo(null);
      setHasCommented(true);
      const data = await commentService.getComments(postId);
      setComments(buildThreaded(data));
      onCommentAdded?.();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="comments-loading">Loading...</div>;

  return (
    <div className="comments-section">
      {replyingTo && (
        <div className="comment-reply-banner">
          <CornerDownRight size={13} />
          <span>Replying to <strong>@{replyingTo.authorData?.username}</strong></span>
          <button className="comment-reply-cancel" onClick={cancelReply}>×</button>
        </div>
      )}
      <div className="comment-input-row">
        <input
          ref={inputRef}
          className="comment-input"
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
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
              <CommentItem key={c.objectId} c={c} onReply={handleReply} depth={0} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
