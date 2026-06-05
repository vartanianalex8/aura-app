import Parse from './parse';

const Report = Parse.Object.extend('Report');

export const REPORT_CATEGORIES = [
  { value: 'harassment', label: '😤 Harassment or Bullying' },
  { value: 'hate_speech', label: '🚫 Hate Speech' },
  { value: 'spam', label: '📢 Spam' },
  { value: 'illegal_content', label: '⛔ Illegal Content' },
  { value: 'nsfw', label: '🔞 Inappropriate Content' },
  { value: 'other', label: '❓ Other' },
];

export const moderationService = {
  async reportPost(postId, category, details = '') {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    const existing = new Parse.Query(Report);
    existing.equalTo('reporter', user);
    existing.equalTo('targetId', postId);
    existing.equalTo('targetType', 'post');
    const found = await existing.first().catch(() => null);
    if (found) throw new Error('You already reported this post');
    const report = new Report();
    report.set('reporter', user);
    report.set('reporterUsername', user.get('username'));
    report.set('targetId', postId);
    report.set('targetType', 'post');
    report.set('category', category);
    report.set('details', details);
    report.set('status', 'pending');
    report.set('severity', ['illegal_content', 'hate_speech'].includes(category) ? 'high' : 'low');
    const acl = new Parse.ACL();
    acl.setWriteAccess(user, true);
    acl.setReadAccess(user, true);
    report.setACL(acl);
    await report.save();
  },

  async reportUser(targetUserId, category, details = '') {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    if (user.id === targetUserId) throw new Error("You can't report yourself");
    const existing = new Parse.Query(Report);
    existing.equalTo('reporter', user);
    existing.equalTo('targetId', targetUserId);
    existing.equalTo('targetType', 'user');
    const found = await existing.first().catch(() => null);
    if (found) throw new Error('You already reported this user');
    const report = new Report();
    report.set('reporter', user);
    report.set('reporterUsername', user.get('username'));
    report.set('targetId', targetUserId);
    report.set('targetType', 'user');
    report.set('category', category);
    report.set('details', details);
    report.set('status', 'pending');
    report.set('severity', ['illegal_content', 'hate_speech'].includes(category) ? 'high' : 'low');
    const acl = new Parse.ACL();
    acl.setWriteAccess(user, true);
    acl.setReadAccess(user, true);
    report.setACL(acl);
    await report.save();
  },

  async blockUser(targetUserId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    const blocked = user.get('blockedUsers') || [];
    if (!blocked.includes(targetUserId)) {
      blocked.push(targetUserId);
      user.set('blockedUsers', blocked);
      await user.save();
    }
  },

  async unblockUser(targetUserId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    const blocked = (user.get('blockedUsers') || []).filter((id) => id !== targetUserId);
    user.set('blockedUsers', blocked);
    await user.save();
  },

  isBlocked(targetUserId) {
    const user = Parse.User.current();
    if (!user) return false;
    return (user.get('blockedUsers') || []).includes(targetUserId);
  },

  getBlockedUsers() {
    const user = Parse.User.current();
    if (!user) return [];
    return user.get('blockedUsers') || [];
  },
};
