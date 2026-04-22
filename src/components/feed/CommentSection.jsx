import { useState, useEffect } from 'react';
import { Image } from 'lucide-react';
import { commentService } from '../../services/comments';
import { timeAgo, countWords } from '../../utils/helpers';
import './CommentSection.css';

const QUICK_GIFS = [
  { label: '👏', url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif' },
  { label: '😂', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { label: '🔥', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5APm0/giphy.gif' },
  { label: '❤️', url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif' },
  { label: '🤯', url: 'https://media.giphy.com/media/xT0xeJpnrWC3XWblEk/giphy.gif' },
  { label: '👀', url: 'https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif' },
];

export default function CommentSection({ postId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [hasCommented, setHasCommented] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGifs, setShowGifs] = useState(false);

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
    if (countWords(text) > 10) {
      setError('Max 10 words');
      return;
    }
    setError('');
    try {
      await commentService.addComment(postId, text);
      setText('');
      setHasCommented(true);
      const data = await commentService.getComments(postId);
      setComments(data);
      onCommentAdded?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGif = async (gif) => {
    try {
      await commentService.addComment(postId, `[gif:${gif.url}]`);
      setShowGifs(false);
      setHasCommented(true);
      const data = await commentService.getComments(postId);
      setComments(data);
      onCommentAdded?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderComment = (c) => {
    const gifMatch = c.text?.match(/\[gif:(.*?)\]/);
    if (gifMatch) {
      return <img className="comment-gif" src={gifMatch[1]} alt="gif" />;
    }
    // Highlight @mentions
    const parts = c.text?.split(/(@\w+)/g) || [];
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="comment-mention">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  if (loading) return <div className="comments-loading">Loading...</div>;

  return (
    <div className="comments-section">
      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="Comment... (use @user to mention)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button className="comment-gif-btn" onClick={() => setShowGifs(!showGifs)}>
          <Image size={16} />
        </button>
        <button className="comment-send" onClick={handleSubmit}>Post</button>
      </div>

      {showGifs && (
        <div className="gif-picker">
          {QUICK_GIFS.map((gif, i) => (
            <button key={i} className="gif-option" onClick={() => handleGif(gif)}>
              <img src={gif.url} alt={gif.label} />
            </button>
          ))}
        </div>
      )}

      {error && <p className="comment-error">{error}</p>}

      {!hasCommented ? (
        <p className="comment-gate">Comment to see what others are saying</p>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div key={c.objectId} className="comment-item">
              <span className="comment-author">@{c.authorData?.username}</span>
              <span className="comment-text">{renderComment(c)}</span>
              <span className="comment-time">{timeAgo(c.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
