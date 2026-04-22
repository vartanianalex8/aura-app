export const PARSE_CONFIG = {
  APP_ID: 'PIhre7k77l4LBsvtpgQDcYdscP7AWbEsjLvPFrNE',
  JS_KEY: 'IyAnxYWfHqjlxe2v7dPyCamryUJKTNwLlLfPVsHt',
  SERVER_URL: 'https://parseapi.back4app.com/',
};

export const APP_NAME = 'Aura';

export const POST_RULES = {
  MAX_CAPTION_LENGTH: 1000,
  MAX_COMMENT_WORDS: 10,
  MAX_USERNAME_LENGTH: 15,
  MAX_PROFILE_PIC_SIZE: 10 * 1024 * 1024,
};

export const REACTIONS = ['like', 'dislike', 'sad', 'funny', 'wow', 'love', 'fire', 'mindblown'];

export const REACTION_EMOJIS = {
  like: '👍',
  dislike: '👎',
  sad: '😢',
  funny: '😂',
  wow: '😮',
  love: '❤️',
  fire: '🔥',
  mindblown: '🤯',
};

export const POST_CATEGORIES = [
  { value: 'moment', emoji: '📸', label: 'Moment' },
  { value: 'food', emoji: '🍽️', label: 'Food' },
  { value: 'nature', emoji: '🌿', label: 'Nature' },
  { value: 'fitness', emoji: '💪', label: 'Fitness' },
  { value: 'creative', emoji: '🎨', label: 'Creative' },
  { value: 'music', emoji: '🎵', label: 'Music' },
  { value: 'travel', emoji: '✈️', label: 'Travel' },
  { value: 'thoughts', emoji: '💭', label: 'Thoughts' },
];

export const STATUS_OPTIONS = [
  { value: 'online', emoji: '🟢', label: 'Online' },
  { value: 'away', emoji: '🟡', label: 'Away' },
  { value: 'dnd', emoji: '🔴', label: 'Do Not Disturb' },
  { value: 'offline', emoji: '⚫', label: 'Offline' },
];

export const LOGO_OPTIONS = [
  { value: 'default', label: 'Classic', colors: ['#7B8EC8', '#7B8EC8'] },
  { value: 'sunset', label: 'Sunset', colors: ['#FF6B6B', '#FFA07A'] },
  { value: 'ocean', label: 'Ocean', colors: ['#4ECDC4', '#44A08D'] },
  { value: 'neon', label: 'Neon', colors: ['#A855F7', '#EC4899'] },
  { value: 'gold', label: 'Gold', colors: ['#F59E0B', '#D97706'] },
];

export const BG_OPTIONS = [
  { value: 'default', label: 'Default', bg: null },
  { value: 'mesh1', label: 'Aurora', bg: 'radial-gradient(ellipse at 20% 50%, rgba(123,142,200,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.06) 0%, transparent 50%)' },
  { value: 'mesh2', label: 'Sunset', bg: 'radial-gradient(ellipse at 10% 90%, rgba(255,107,107,0.06) 0%, transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(255,160,122,0.06) 0%, transparent 50%)' },
  { value: 'mesh3', label: 'Ocean', bg: 'radial-gradient(ellipse at 50% 0%, rgba(78,205,196,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(68,160,141,0.06) 0%, transparent 50%)' },
];

export const REPORT_CATEGORIES = [
  'harassment',
  'hate_speech',
  'spam',
  'illegal_content',
];
