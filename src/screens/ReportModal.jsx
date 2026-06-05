import { useState } from 'react';
import { X } from 'lucide-react';
import { moderationService, REPORT_CATEGORIES } from '../services/moderation';

export default function ReportModal({ targetId, targetType, targetName, onClose }) {
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!category) { setError('Please select a reason'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (targetType === 'post') {
        await moderationService.reportPost(targetId, category, details);
      } else {
        await moderationService.reportUser(targetId, category, details);
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report {targetType === 'post' ? 'Post' : '@' + targetName}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {done ? (
          <div className="modal-done">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <p className="modal-done-title">Report submitted</p>
            <p className="modal-done-sub">Thanks for keeping Aura safe. Our team will review this shortly.</p>
            <button className="modal-submit-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="modal-sub">Why are you reporting this?</p>
            <div className="report-categories">
              {REPORT_CATEGORIES.map((c) => (
                <button key={c.value} className={'report-cat-btn' + (category === c.value ? ' active' : '')} onClick={() => setCategory(c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              className="report-details-input"
              placeholder="Additional details (optional)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={300}
              rows={3}
            />
            {error && <p className="modal-error">{error}</p>}
            <button className="modal-submit-btn" onClick={handleSubmit} disabled={submitting || !category}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
