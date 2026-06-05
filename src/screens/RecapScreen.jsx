import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Parse from '../services/parse';
import { useAuth } from '../hooks/useAuth';
import './RecapScreen.css';

const Post = Parse.Object.extend('Post');
const CAT_EMOJI = { moment:'📸', food:'🍽️', nature:'🌿', fitness:'💪', creative:'🎨', music:'🎵', travel:'✈️', thoughts:'💭' };

export default function RecapScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('monthly');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [mode, offset]);

  const load = async () => {
    if (!user?.objectId) return;
    setLoading(true);
    try {
      const now = new Date();
      let start, end, label;
      if (mode === 'monthly') {
        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else {
        const yr = now.getFullYear() + offset;
        start = new Date(yr, 0, 1);
        end = new Date(yr, 11, 31, 23, 59, 59);
        label = String(yr);
      }
      const q = new Parse.Query(Post);
      q.equalTo('author', Parse.User.createWithoutData(user.objectId));
      q.greaterThanOrEqualTo('createdAt', start);
      q.lessThanOrEqualTo('createdAt', end);
      q.descending('totalReactions');
      q.limit(200);
      const posts = await q.find();

      const tagCounts = {};
      const catCounts = {};
      const dayCounts = Array(7).fill(0);
      let totalReactions = 0;
      posts.forEach((p) => {
        (p.get('hashtags') || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
        const c = p.get('category') || 'moment';
        catCounts[c] = (catCounts[c] || 0) + 1;
        dayCounts[new Date(p.get('createdAt')).getDay()]++;
        totalReactions += p.get('totalReactions') || 0;
      });
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const peakDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
      const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const topPost = posts[0] ? {
        objectId: posts[0].id,
        image: posts[0].get('image') ? { url: posts[0].get('image').url() } : null,
        caption: posts[0].get('caption') || '',
        totalReactions: posts[0].get('totalReactions') || 0,
      } : null;
      setData({ label, postCount: posts.length, totalReactions, topTags, topPost, peakDay, topCategory, dayCounts, dayNames });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="recap-screen">
      <header className="recap-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
        <h2>Your Recap</h2>
        <div style={{ width: 36 }} />
      </header>
      <div className="recap-mode-toggle">
        <button className={'recap-mode-btn' + (mode === 'monthly' ? ' active' : '')} onClick={() => { setMode('monthly'); setOffset(0); }}>Monthly</button>
        <button className={'recap-mode-btn' + (mode === 'yearly' ? ' active' : '')} onClick={() => { setMode('yearly'); setOffset(0); }}>Yearly</button>
      </div>
      <div className="recap-period-nav">
        <button className="recap-nav-btn" onClick={() => setOffset((o) => o - 1)} disabled={offset <= (mode === 'monthly' ? -12 : -5)}><ChevronLeft size={18} /></button>
        <span className="recap-period-label">{data?.label || '...'}</span>
        <button className="recap-nav-btn" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0}><ChevronRight size={18} /></button>
      </div>
      {loading ? (
        <div className="recap-loading"><div className="recap-loading-spinner" /><p>Crunching your moments...</p></div>
      ) : !data || data.postCount === 0 ? (
        <div className="recap-empty">
          <p style={{ fontSize: '3rem' }}>📭</p>
          <p className="recap-empty-title">No posts this period</p>
          <p className="recap-empty-sub">Start posting to see your recap here</p>
        </div>
      ) : (
        <div className="recap-content">
          <div className="recap-hero">
            <div className="recap-hero-num">{data.postCount}</div>
            <div className="recap-hero-label">moment{data.postCount !== 1 ? 's' : ''} captured</div>
          </div>
          <div className="recap-stats-row">
            <div className="recap-stat-card"><span className="recap-stat-val">{data.totalReactions}</span><span className="recap-stat-label">Total Reactions</span></div>
            <div className="recap-stat-card"><span className="recap-stat-val">{data.peakDay}</span><span className="recap-stat-label">Most Active Day</span></div>
            {data.topCategory && <div className="recap-stat-card"><span className="recap-stat-val" style={{ fontSize: '1.5rem' }}>{CAT_EMOJI[data.topCategory] || '📸'}</span><span className="recap-stat-label">Top Category</span></div>}
          </div>
          {data.topPost && (
            <div className="recap-section">
              <h3 className="recap-section-title">⭐ Most Loved Post</h3>
              <div className="recap-top-post">
                {data.topPost.image ? <img src={data.topPost.image.url} alt="" className="recap-top-post-img" /> : <div className="recap-top-post-text">{data.topPost.caption?.slice(0, 100)}</div>}
                <div style={{ padding: '0.75rem 1rem' }}>
                  {data.topPost.caption && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{data.topPost.caption.slice(0, 80)}{data.topPost.caption.length > 80 ? '…' : ''}</p>}
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>❤️ {data.topPost.totalReactions} reactions</p>
                </div>
              </div>
            </div>
          )}
          {data.topTags.length > 0 && (
            <div className="recap-section">
              <h3 className="recap-section-title">🏷️ Your Top Tags</h3>
              <div className="recap-tags">
                {data.topTags.map(({ tag, count }, i) => (
                  <div key={tag} className={'recap-tag-row' + (i === 0 ? ' recap-tag-row--top' : '')}>
                    <span className="recap-tag-rank">#{i + 1}</span>
                    <span className="recap-tag-name">#{tag}</span>
                    <span className="recap-tag-count">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="recap-section">
            <h3 className="recap-section-title">📅 Activity by Day</h3>
            <div className="recap-bar-chart">
              {data.dayNames.map((day, i) => {
                const max = Math.max(...data.dayCounts, 1);
                const pct = (data.dayCounts[i] / max) * 100;
                return (
                  <div key={day} className="recap-bar-col">
                    <div className="recap-bar-wrap"><div className="recap-bar" style={{ height: Math.max(pct, 4) + '%' }} /></div>
                    <span className="recap-bar-label">{day}</span>
                    {data.dayCounts[i] > 0 && <span className="recap-bar-count">{data.dayCounts[i]}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="recap-footer-msg">
            {data.postCount >= 20 ? '🔥 You\'re on fire! Incredible consistency.' : data.postCount >= 10 ? '✨ Great period! You\'re building something beautiful.' : data.postCount >= 5 ? '🌱 Nice work. Every moment counts.' : '📸 A small start. Keep going — you\'ve got this.'}
          </div>
        </div>
      )}
    </div>
  );
}
