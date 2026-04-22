import Parse from './parse';

const Follow = Parse.Object.extend('Follow');

export const socialService = {
  async follow(targetUserId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');

    const existing = await this.isFollowing(targetUserId);
    if (existing) throw new Error('Already following');

    const follow = new Follow();
    follow.set('follower', user);
    follow.set('following', Parse.User.createWithoutData(targetUserId));
    follow.set('followerUsername', user.get('username'));

    const acl = new Parse.ACL(user);
    acl.setPublicReadAccess(true);
    follow.setACL(acl);

    await follow.save();
  },

  async unfollow(targetUserId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');

    const query = new Parse.Query(Follow);
    query.equalTo('follower', user);
    query.equalTo('following', Parse.User.createWithoutData(targetUserId));
    const result = await query.first();
    if (result) await result.destroy();
  },

  async isFollowing(targetUserId) {
    const user = Parse.User.current();
    if (!user) return false;

    const query = new Parse.Query(Follow);
    query.equalTo('follower', user);
    query.equalTo('following', Parse.User.createWithoutData(targetUserId));
    const count = await query.count();
    return count > 0;
  },

  async getFollowing() {
    const user = Parse.User.current();
    if (!user) return [];

    const query = new Parse.Query(Follow);
    query.equalTo('follower', user);
    query.include('following');
    const results = await query.find();
    return results.map((f) => {
      const u = f.get('following');
      return {
        objectId: u?.id,
        username: u?.get('username'),
        profilePicture: u?.get('profilePicture')?.url() || null,
      };
    });
  },

  async getFollowerCount(userId) {
    const query = new Parse.Query(Follow);
    query.equalTo('following', Parse.User.createWithoutData(userId));
    return await query.count();
  },

  async getFollowingCount(userId) {
    const query = new Parse.Query(Follow);
    query.equalTo('follower', Parse.User.createWithoutData(userId));
    return await query.count();
  },

  async savePost(postId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');

    const saved = user.get('savedPosts') || [];
    if (!saved.includes(postId)) {
      saved.push(postId);
      user.set('savedPosts', saved);
      await user.save();
    }
  },

  async unsavePost(postId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');

    const saved = (user.get('savedPosts') || []).filter((id) => id !== postId);
    user.set('savedPosts', saved);
    await user.save();
  },

  isPostSaved(postId) {
    const user = Parse.User.current();
    if (!user) return false;
    return (user.get('savedPosts') || []).includes(postId);
  },

  async getSavedPosts() {
    const user = Parse.User.current();
    if (!user) return [];

    const saved = user.get('savedPosts') || [];
    if (saved.length === 0) return [];

    const Post = Parse.Object.extend('Post');
    const query = new Parse.Query(Post);
    query.containedIn('objectId', saved);
    query.include('author');
    query.descending('createdAt');
    const results = await query.find();
    return results.map((p) => ({
      ...p.toJSON(),
      authorData: {
        objectId: p.get('author')?.id,
        username: p.get('authorUsername') || p.get('author')?.get('username') || 'unknown',
        profilePicture: p.get('authorProfilePic') || p.get('author')?.get('profilePicture')?.url() || null,
      },
    }));
  },

  async getStreakLeaderboard(limit = 20) {
    try {
      const query = new Parse.Query(Parse.User);
      query.descending('streakCount');
      query.exists('streakCount');
      query.notEqualTo('streakCount', 0);
      query.limit(limit);
      const results = await query.find();
      return results.map((u, i) => ({
        rank: i + 1,
        objectId: u.id,
        username: u.get('username') || 'unknown',
        streakCount: u.get('streakCount') || 0,
        longestStreak: u.get('longestStreak') || 0,
        profilePicture: u.get('profilePicture')?.url?.() || u.get('profilePicture') || null,
      }));
    } catch (err) {
      console.error('[Aura] Leaderboard query failed:', err);
      try {
        const fallbackQuery = new Parse.Query(Parse.User);
        fallbackQuery.limit(100);
        const all = await fallbackQuery.find();
        return all
          .filter((u) => (u.get('streakCount') || 0) > 0)
          .sort((a, b) => (b.get('streakCount') || 0) - (a.get('streakCount') || 0))
          .slice(0, limit)
          .map((u, i) => ({
            rank: i + 1,
            objectId: u.id,
            username: u.get('username') || 'unknown',
            streakCount: u.get('streakCount') || 0,
            longestStreak: u.get('longestStreak') || 0,
            profilePicture: u.get('profilePicture')?.url?.() || u.get('profilePicture') || null,
          }));
      } catch (fallbackErr) {
        console.error('[Aura] Leaderboard fallback failed:', fallbackErr);
        return [];
      }
    }
  },

  async getTrendingHashtags(limit = 10) {
    const Post = Parse.Object.extend('Post');
    const query = new Parse.Query(Post);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query.greaterThanOrEqualTo('createdAt', weekAgo);
    query.exists('hashtags');
    query.limit(200);
    query.select('hashtags');
    const results = await query.find();

    const tagCounts = {};
    results.forEach((p) => {
      (p.get('hashtags') || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  },
};
