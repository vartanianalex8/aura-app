import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, ImagePlus } from 'lucide-react';
import { postService } from '../services/posts';
import { POST_RULES, POST_CATEGORIES } from '../constants/config';
import { ROUTES } from '../constants/routes';
import './PostScreen.css';

export default function PostScreen() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('moment');
  const [canPost, setCanPost] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    checkCanPost();
    detectLocation();
  }, []);

  const checkCanPost = async () => {
    const ok = await postService.canPostToday();
    setCanPost(ok);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = addr.state || '';
          const country = addr.country_code?.toUpperCase() || '';
          setLocation([city, state, country].filter(Boolean).join(', '));
        } catch {
          setLocation('');
        }
      },
      () => {}
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => { setImage(null); setPreview(null); };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) setHashtags([...hashtags, tag]);
    setHashtagInput('');
  };

  const handleSubmit = async () => {
    if (!canPost) return setError('You already posted today!');
    if (!caption.trim() && !image) return setError('Add a photo or write something first');
    setLoading(true);
    setError('');
    try {
      await postService.createPost({ caption, hashtags, location, image, category });
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!canPost) {
    return (
      <div className="post-screen post-screen--done">
        <div className="post-done-icon">✨</div>
        <h2>You've shared your moment today</h2>
        <p>Come back tomorrow to capture another one.</p>
      </div>
    );
  }

  return (
    <div className="post-screen">
      <header className="post-screen-header">
        <h2>New Moment</h2>
        <button
          className="post-submit-btn"
          onClick={handleSubmit}
          disabled={loading || (!caption.trim() && !image)}
        >
          {loading ? 'Sharing...' : 'Share'}
        </button>
      </header>

      {error && <div className="post-error">{error}</div>}

      {/* Image area */}
      <div className="post-image-area">
        {preview ? (
          <div className="post-preview-wrap">
            <img src={preview} alt="Preview" className="post-preview-img" />
            <button className="post-preview-remove" onClick={removeImage}><X size={18} /></button>
          </div>
        ) : (
          <button className="post-image-placeholder" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={32} />
            <span>Add a photo</span>
            <span className="post-image-optional">optional</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      </div>

      {/* Caption */}
      <div className="post-caption-area">
        <textarea
          className="post-caption-input"
          placeholder="What's your moment today?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={POST_RULES.MAX_CAPTION_LENGTH}
          rows={3}
        />
        <span className="char-count">{caption.length}/{POST_RULES.MAX_CAPTION_LENGTH}</span>
      </div>

      {/* Category */}
      <div className="post-section">
        <span className="post-section-label">Category</span>
        <div className="category-options">
          {POST_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`category-chip ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="post-section">
        <span className="post-section-label">Hashtags</span>
        <div className="hashtag-row">
          <input
            className="auth-input"
            placeholder="Add a hashtag"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
          />
          <button className="tag-add-btn" onClick={addHashtag}>+</button>
        </div>
        {hashtags.length > 0 && (
          <div className="hashtag-chips">
            {hashtags.map((t) => (
              <span key={t} className="hashtag-chip" onClick={() => setHashtags(hashtags.filter((h) => h !== t))}>
                #{t} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="post-section">
        <span className="post-section-label">Location</span>
        <div className="location-row">
          <MapPin size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            className="auth-input"
            placeholder="Add location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
