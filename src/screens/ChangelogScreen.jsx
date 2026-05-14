import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChangelogScreen.css';

const VERSIONS = [
  {
    version: '1.6.0',
    date: 'May 14, 2026',
    title: 'The Social Overhaul',
    changes: [
      { type: 'new', text: 'Following feed — new tab on the home screen showing only posts from people you follow' },
      { type: 'new', text: 'Notifications — get alerted when someone reacts to your post, comments, or follows you' },
      { type: 'new', text: 'Notification bell in the bottom nav with live unread badge' },
      { type: 'new', text: 'Edit Profile — change your photo, username, and bio directly from the profile page' },
      { type: 'new', text: 'Post search — search for posts by keyword or hashtag, not just usernames' },
      { type: 'new', text: 'Recent searches — search history saved locally, just like Instagram' },
      { type: 'improved', text: 'Profile layout redesigned — cleaner Instagram-style with pic + stats side by side' },
      { type: 'improved', text: 'Other user profiles now show a full post grid (not just today\'s moment)' },
      { type: 'improved', text: 'Followers and following counts now shown on both your profile and others\'' },
      { type: 'improved', text: 'Reaction UI redesigned — collapsed to a single button that expands into an emoji picker' },
      { type: 'improved', text: 'Post expiry timer now only shows when under 6 hours remain' },
      { type: 'improved', text: 'Comment word limit raised from 10 to 50 words' },
      { type: 'improved', text: 'Post creation simplified to a single screen — no more multi-step wizard' },
      { type: 'improved', text: 'Feed now paginates — loads 15 posts at a time with infinite scroll' },
      { type: 'improved', text: 'Refresh button added to the home feed header' },
      { type: 'improved', text: 'Settings simplified — removed Logo Style and Background clutter' },
      { type: 'fix', text: 'Logout moved to Settings only — removed from profile page' },
      { type: 'fix', text: 'GIF picker removed — was limited to 6 hardcoded GIFs' },
      { type: 'fix', text: 'Leaderboard removed temporarily for a full redesign' },
    ],
  },
  {
    version: '1.5.0',
    date: 'April 15, 2026',
    title: 'Profiles & Polish',
    changes: [
      { type: 'new', text: 'View other users\' profiles — tap any @username in the feed or search results' },
      { type: 'new', text: 'User profile pages show avatar, streak stats, follower/following counts, and posts grid' },
      { type: 'new', text: 'Follow/unfollow directly from profile pages' },
      { type: 'new', text: 'Change username and email from Settings → Account' },
      { type: 'new', text: 'Password confirmation on signup — must type password twice' },
      { type: 'improved', text: 'Softer dark mode — background lightened from pure black to dark charcoal' },
      { type: 'improved', text: 'Bolder header font — Cormorant Garamond bumped from weight 300 to 500' },
      { type: 'improved', text: 'Password reset now sends actual Parse email instead of just alerting' },
    ],
  },
  {
    version: '1.4.0',
    date: 'April 15, 2026',
    title: 'Stability & Cleanup',
    changes: [
      { type: 'new', text: 'Posts auto-delete after 24 hours — expiry countdown shown on each post' },
      { type: 'new', text: 'Expired posts and their reactions/comments are cleaned up automatically' },
      { type: 'fix', text: 'Reactions now persist after page refresh (ACL permission fix)' },
      { type: 'fix', text: 'Comments now persist after page refresh (ACL permission fix)' },
      { type: 'fix', text: 'Leaderboard now loads correctly (query fix with fallback)' },
      { type: 'improved', text: 'Post deletion also cleans up associated reactions and comments' },
    ],
  },
  {
    version: '1.3.0',
    date: 'April 9, 2026',
    title: 'The Big Feature Drop',
    changes: [
      { type: 'new', text: 'Edit posts — tap ••• menu on your posts to edit captions after posting' },
      { type: 'new', text: 'GIF comments — tap the image icon in comments to pick a reaction GIF' },
      { type: 'new', text: '8 reactions — added ❤️ Love, 🔥 Fire, and 🤯 Mind Blown emotes' },
      { type: 'new', text: 'Topic of the Week — rotating weekly prompt shown on the home feed' },
      { type: 'new', text: 'Post categories — tag your post as Moment, Food, Nature, Fitness, Creative, Music, Travel, or Thoughts' },
      { type: 'new', text: 'Category icon shown on each post card' },
      { type: 'new', text: 'Logo style options — choose Classic, Sunset, Ocean, Neon, or Gold accent colors in Settings' },
      { type: 'new', text: 'Background options — choose Default, Aurora, Sunset, or Ocean mesh backgrounds' },
      { type: 'new', text: 'User status — set Online, Away, Do Not Disturb, or Offline from Settings' },
      { type: 'new', text: 'Status dot shown on avatars in the feed' },
      { type: 'new', text: '@mention highlighting in comments — type @username to mention someone' },
      { type: 'improved', text: 'Landscape mode support — nav bar and post images adapt to horizontal orientation' },
      { type: 'improved', text: 'Reactions bar now scrolls horizontally when space is tight' },
      { type: 'improved', text: 'Profile stats are now visually symmetric with icons on all three stats' },
    ],
  },
  {
    version: '1.2.0',
    date: 'April 9, 2026',
    title: 'Social Update',
    changes: [
      { type: 'new', text: 'Hamburger menu — 5th nav item opens a side drawer with quick links' },
      { type: 'new', text: 'Follow/unfollow users from search results' },
      { type: 'new', text: 'Bookmark/save posts — tap the bookmark icon on any post' },
      { type: 'new', text: 'Saved Posts page — access from the side drawer' },
      { type: 'new', text: 'Streak Leaderboard — top 20 users with podium for top 3' },
      { type: 'new', text: 'Trending hashtags — shown on the search/discover page' },
      { type: 'new', text: 'Interactable hashtags — tap any tag to see all posts with it' },
      { type: 'new', text: 'Hashtag page — dedicated view for browsing posts by tag' },
      { type: 'improved', text: 'Bottom nav is now symmetric with 5 balanced items' },
      { type: 'improved', text: 'Desktop optimization — centered app shell with subtle border on wider screens' },
      { type: 'improved', text: 'Search now shows follow buttons next to user results' },
      { type: 'improved', text: 'Side drawer shows user info, streak, and quick navigation' },
      { type: 'improved', text: 'Logout moved to side drawer for cleaner profile page' },
    ],
  },
  {
    version: '1.1.0',
    date: 'April 8, 2026',
    title: 'Quality of Life Update',
    changes: [
      { type: 'fix', text: 'Fixed "unknown" showing instead of usernames on all posts' },
      { type: 'fix', text: 'Fixed search not returning any results' },
      { type: 'new', text: 'Delete posts — tap the ••• menu on your own posts' },
      { type: 'new', text: 'Clickable profile posts — tap any post in your grid to view details' },
      { type: 'new', text: 'Post detail modal with reactions breakdown and delete option' },
      { type: 'new', text: '"Popular" sort filter added to the home feed' },
      { type: 'improved', text: 'Dark theme is now the default — no more flashbang' },
      { type: 'improved', text: 'Logo icon added to the top bar' },
      { type: 'improved', text: 'Usernames now display with @ prefix everywhere' },
      { type: 'improved', text: 'Search now queries usernames, hashtags, and captions' },
      { type: 'improved', text: 'Feed now shows all posts, not just today\'s' },
    ],
  },
  {
    version: '1.0.0',
    date: 'April 8, 2026',
    title: 'Initial Launch',
    changes: [
      { type: 'new', text: 'One post per day system — enforced server-side' },
      { type: 'new', text: 'Back4App authentication — signup, login, forgot password' },
      { type: 'new', text: '3-step post creation flow: capture → preview → configure' },
      { type: 'new', text: 'Image, image + caption, or text-only posts' },
      { type: 'new', text: 'Captions up to 1000 characters with hashtag support' },
      { type: 'new', text: 'Auto-detect location on posts' },
      { type: 'new', text: '5-reaction system: 👍 👎 😢 😂 😮' },
      { type: 'new', text: 'Comment gating — must comment before seeing others' },
      { type: 'new', text: '10-word max comments with threaded replies' },
      { type: 'new', text: 'Daily streak tracking with auto-reset on missed days' },
      { type: 'new', text: 'Profile page with avatar, streak stats, and posts grid' },
      { type: 'new', text: 'Search users and hashtags' },
      { type: 'new', text: 'Settings: light/dark/system theme toggle' },
      { type: 'new', text: 'Profile picture upload (max 10MB)' },
      { type: 'new', text: 'Password reset via email' },
      { type: 'new', text: 'Protected routing — auth gates on all screens' },
      { type: 'new', text: 'Mobile-first responsive design' },
      { type: 'new', text: 'Deployed on Vercel' },
    ],
  },
];

const TAG_STYLES = {
  new: { label: 'NEW', color: '#4CAF50' },
  fix: { label: 'FIX', color: '#FF9800' },
  improved: { label: 'IMPROVED', color: '#7B8EC8' },
};

export default function ChangelogScreen() {
  const navigate = useNavigate();

  return (
    <div className="changelog-screen">
      <header className="changelog-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2>Patch Notes</h2>
      </header>

      <div className="changelog-list">
        {VERSIONS.map((v) => (
          <div key={v.version} className="changelog-version">
            <div className="version-header">
              <span className="version-badge">v{v.version}</span>
              <span className="version-date">{v.date}</span>
            </div>
            <h3 className="version-title">{v.title}</h3>
            <ul className="version-changes">
              {v.changes.map((c, i) => (
                <li key={i} className="change-item">
                  <span
                    className="change-tag"
                    style={{ background: TAG_STYLES[c.type].color }}
                  >
                    {TAG_STYLES[c.type].label}
                  </span>
                  <span className="change-text">{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
