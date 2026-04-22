import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, MapPin } from 'lucide-react';
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
  const [step, setStep] = useState(1);
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
          // Fallback: leave blank so user can type manually
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
    setStep(2);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!canPost) return setError('You already posted today!');
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
        <h2>Share your moment</h2>
        <span className="post-step-label">Step {step} of 3</span>
      </header>

      {error && <div className="post-error">{error}</div>}

      {step === 1 && (
        <div className="post-capture">
          <div className="capture-area" onClick={() => fileRef.current?.click()}>
            <Camera size={40} />
            <p>Tap to add a photo</p>
            <span>or skip for a text-only post</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
          <button className="skip-btn" onClick={() => setStep(3)}>
            Text only post →
          </button>
        </div>
      )}

      {step === 2 && preview && (
        <div className="post-preview">
          <div className="preview-img-wrap">
            <img src={preview} alt="Preview" />
            <button className="preview-remove" onClick={() => { setImage(null); setPreview(null); setStep(1); }}>
              <X size={18} />
            </button>
          </div>
          <button className="auth-btn" onClick={() => setStep(3)}>Looks good →</button>
        </div>
      )}

      {step === 3 && (
        <div className="post-config">
          {preview && (
            <div className="config-thumb">
              <img src={preview} alt="" />
            </div>
          )}

          {/* Category picker */}
          <div className="category-picker">
            <span className="category-label">Category</span>
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

          <textarea
            className="post-caption-input"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={POST_RULES.MAX_CAPTION_LENGTH}
          />
          <span className="char-count">{caption.length}/{POST_RULES.MAX_CAPTION_LENGTH}</span>

          <div className="hashtag-row">
            <input
              className="auth-input"
              placeholder="Add hashtag"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
            />
            <button className="tag-add-btn" onClick={addHashtag}>+</button>
          </div>
          {hashtags.length > 0 && (
            <div className="hashtag-chips">
              {hashtags.map((t) => (
                <span key={t} className="hashtag-chip" onClick={() => removeHashtag(t)}>#{t} ×</span>
              ))}
            </div>
          )}

          <div className="location-row">
            <MapPin size={16} />
            <input
              className="auth-input"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Posting...' : 'Share your moment'}
          </button>
        </div>
      )}
    </div>
  );
}
