import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

const SECTIONS = [
  {
    id: 'login', icon: '🔐', title: 'Login, Recovery & Security',
    faqs: [
      { q: 'How do I log in?', a: 'Open Aura and enter your username (or email) and password. Tap "Log In" to access your account.' },
      { q: 'I forgot my password. What do I do?', a: 'Tap "Forgot password?" on the login screen. Enter your registered email and we\'ll send a reset link. Check your spam folder if you don\'t see it within a few minutes.' },
      { q: 'I forgot my username. How do I recover it?', a: 'You can log in with your email address instead of your username. Use the password reset flow with your email to regain access.' },
      { q: 'I think my account was hacked. What should I do?', a: 'Immediately reset your password via "Forgot password?". Then review your account for unauthorized changes. Contact support if you can\'t access your account at all.' },
      { q: 'How do I change my password?', a: 'Go to Profile → Settings → Account → Reset Password. We\'ll send a reset link to your registered email.' },
    ],
  },
  {
    id: 'suspended', icon: '⛔', title: 'Suspended or Restricted Accounts',
    faqs: [
      { q: 'Why was my account suspended?', a: 'Accounts are suspended for violating community guidelines — including harassment, hate speech, spam, or illegal content. You\'ll receive a notification explaining the reason.' },
      { q: 'What\'s the difference between a temporary and permanent suspension?', a: 'Temporary suspensions last 24 hours to 30 days depending on severity. Permanent bans are reserved for serious or repeated violations. During a temp suspension, you can view the app but cannot post or interact.' },
      { q: 'What happens to my streak during a suspension?', a: 'If you cannot post due to a suspension, contact support to review your case. We handle streak impacts on a case-by-case basis for account errors.' },
      { q: 'How do I appeal a suspension?', a: 'Email support@aura-app.com with your username and a brief explanation of why you believe the suspension was made in error. Appeals are reviewed within 3–5 business days.' },
    ],
  },
  {
    id: 'terms', icon: '📋', title: 'Terms, Policies & Guidelines',
    faqs: [
      { q: 'What is the one-post-per-day rule?', a: 'Each user can post exactly one moment per day, resetting at midnight in your local time. This rule encourages intentional sharing. It is enforced server-side — there is no way around it.' },
      { q: 'What happens if I miss a day?', a: 'Your streak resets to zero. This is intentional — Aura is about consistency. You can always start a new streak the next day!' },
      { q: 'Can I delete my post?', a: 'Yes, but only once per day. Once removed, the post and all its reactions and comments are permanently gone.' },
      { q: 'What content is not allowed?', a: 'Prohibited content includes: harassment, hate speech, sexually explicit material, illegal content, spam, and impersonation. Violations result in content removal and possible account action.' },
      { q: 'What data does Aura collect?', a: 'Aura collects your username, email, posts, reactions, and comments to power the app experience. We do not sell your data to third parties.' },
      { q: 'What are the comment rules?', a: 'Comments must be 50 words or fewer. You must post a comment before you can see others\' comments — this encourages genuine engagement. Comments must follow the same content guidelines as posts.' },
    ],
  },
  {
    id: 'contact', icon: '📬', title: 'Contact & Urgent Support',
    faqs: [
      { q: 'How do I contact support?', a: 'Email us at support@aura-app.com — we typically respond within 48 hours on business days.' },
      { q: 'My account was hacked and I can\'t log in at all.', a: 'Email support@aura-app.com immediately with your registered email and any account info you can provide. Write URGENT in the subject line.' },
      { q: 'How do I report a bug?', a: 'Check Patch Notes (side drawer) for known issues. For new bugs, email us with a description of what happened, what device you\'re on, and a screenshot if possible.' },
      { q: 'I have a feature suggestion.', a: 'We\'d love to hear it! Email feedback@aura-app.com — we read every message even if we can\'t reply to all of them.' },
    ],
  },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', padding: '0.8rem 1rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
        <span>{faq.q}</span>
        {open ? <ChevronUp size={15} style={{ flexShrink: 0 }} /> : <ChevronDown size={15} style={{ flexShrink: 0 }} />}
      </div>
      {open && <p style={{ padding: '0 1rem 0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.55', margin: 0 }}>{faq.a}</p>}
    </div>
  );
}

export default function HelpScreen() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
        <h2>Help Center</h2>
      </header>
      <div style={{ padding: '0.5rem 1rem 2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem', paddingTop: '0.25rem' }}>Browse topics below or contact us directly for urgent help.</p>
        {SECTIONS.map((section) => (
          <div key={section.id} style={{ marginBottom: '0.7rem' }}>
            <button onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.95rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: activeSection === section.id ? '14px 14px 0 0' : '14px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.88rem', gap: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>{section.icon}</span>{section.title}
              </span>
              {activeSection === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {activeSection === section.id && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
                {section.faqs.map((faq, i) => <FAQItem key={i} faq={faq} />)}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginTop: '1.5rem', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '16px', padding: '1.2rem', textAlign: 'center' }}>
          <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Need direct help?</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>Our team typically responds within 48 hours</p>
          <a href="mailto:support@aura-app.com" style={{ display: 'inline-block', padding: '0.55rem 1.4rem', background: 'var(--accent)', color: '#fff', borderRadius: '999px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
            📧 Email Support
          </a>
        </div>
      </div>
    </div>
  );
}
