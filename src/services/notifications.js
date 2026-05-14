import Parse from './parse';

const Notification = Parse.Object.extend('Notification');

export const notificationService = {
  /**
   * Create a notification for another user.
   * type: 'reaction' | 'comment' | 'follow'
   */
  async create({ toUserId, type, actorUsername, postId = null, message = '' }) {
    const toUser = Parse.User.createWithoutData(toUserId);
    const currentUser = Parse.User.current();
    if (!currentUser || currentUser.id === toUserId) return; // don't notify yourself

    const n = new Notification();
    n.set('toUser', toUser);
    n.set('fromUserId', currentUser.id);
    n.set('fromUsername', actorUsername || currentUser.get('username'));
    n.set('type', type);
    n.set('postId', postId || '');
    n.set('message', message);
    n.set('read', false);

    const acl = new Parse.ACL();
    acl.setReadAccess(toUser, true);
    acl.setWriteAccess(toUser, true);
    acl.setReadAccess(currentUser, true);
    n.setACL(acl);

    try {
      await n.save();
    } catch (err) {
      console.warn('[Aura] Could not create notification:', err.message);
    }
  },

  async getMyNotifications(limit = 30) {
    const user = Parse.User.current();
    if (!user) return [];
    const query = new Parse.Query(Notification);
    query.equalTo('toUser', user);
    query.descending('createdAt');
    query.limit(limit);
    const results = await query.find();
    return results.map((n) => ({
      objectId: n.id,
      type: n.get('type'),
      fromUserId: n.get('fromUserId'),
      fromUsername: n.get('fromUsername'),
      postId: n.get('postId'),
      message: n.get('message'),
      read: n.get('read'),
      createdAt: n.get('createdAt'),
    }));
  },

  async getUnreadCount() {
    const user = Parse.User.current();
    if (!user) return 0;
    const query = new Parse.Query(Notification);
    query.equalTo('toUser', user);
    query.equalTo('read', false);
    return await query.count().catch(() => 0);
  },

  async markAllRead() {
    const user = Parse.User.current();
    if (!user) return;
    const query = new Parse.Query(Notification);
    query.equalTo('toUser', user);
    query.equalTo('read', false);
    query.limit(100);
    const unread = await query.find();
    unread.forEach((n) => n.set('read', true));
    if (unread.length > 0) await Parse.Object.saveAll(unread);
  },
};
