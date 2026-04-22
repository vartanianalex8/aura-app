export function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/\d/.test(pw)) return 'Password must contain a number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return 'Password must contain a special character';
  return null;
}

export function validateUsername(u) {
  if (u.length > 15) return 'Username must be 15 characters or fewer';
  if (!/^[a-zA-Z0-9._]+$/.test(u)) return 'Only letters, numbers, dots, and underscores';
  return null;
}

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getDominantReaction(counts) {
  if (!counts) return null;
  let max = 0;
  let dominant = null;
  Object.entries(counts).forEach(([key, val]) => {
    if (val > max) { max = val; dominant = key; }
  });
  return dominant;
}

export function getTotalReactions(counts) {
  if (!counts) return 0;
  return Object.values(counts).reduce((a, b) => a + b, 0);
}
