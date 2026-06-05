import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import './OnboardingScreen.css';

const SLIDES = [
  {
    emoji: '✦',
    title: 'One moment a day.',
    sub: 'Aura gives you one post per day. No more endless scrolling or pressure to constantly create — just one intentional moment.',
  },
  {
    emoji: '🔥',
    title: 'Build your streak.',
    sub: 'Post every day to keep your streak alive. Miss a day and it resets. Consistency is the whole game.',
  },
  {
    emoji: '💬',
    title: 'Earn the conversation.',
    sub: 'Comment first to unlock what others are saying. It keeps things real — no lurking, just genuine exchange.',
  },
  {
    emoji: '🏷️',
    title: 'Find your people.',
    sub: 'Use hashtags to connect with others sharing the same moments. Explore trending topics and follow people who inspire you.',
  },
  {
    emoji: '🌟',
    title: 'You\'re ready.',
    sub: 'Capture something real today. It doesn\'t need to be perfect — it just needs to be yours.',
  },
];

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem('aura_onboarded', '1');
      navigate(ROUTES.HOME, { replace: true });
    } else {
      setSlide(s => s + 1);
    }
  };

  const skip = () => {
    localStorage.setItem('aura_onboarded', '1');
    navigate(ROUTES.HOME, { replace: true });
  };

  const s = SLIDES[slide];

  return (
    <div className="onboarding-screen">
      {/* Skip */}
      {!isLast && (
        <button className="onboarding-skip" onClick={skip}>Skip</button>
      )}

      {/* Slide content */}
      <div className="onboarding-content">
        <div className="onboarding-emoji">{s.emoji}</div>
        <h1 className="onboarding-title">{s.title}</h1>
        <p className="onboarding-sub">{s.sub}</p>
      </div>

      {/* Dots */}
      <div className="onboarding-dots">
        {SLIDES.map((_, i) => (
          <div key={i} className={'onboarding-dot' + (i === slide ? ' active' : '')} onClick={() => setSlide(i)} />
        ))}
      </div>

      {/* CTA */}
      <button className="onboarding-btn" onClick={next}>
        {isLast ? '✦ Start posting' : 'Next'}
      </button>
    </div>
  );
}
