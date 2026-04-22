import Parse from './parse';

const Post = Parse.Object.extend('Post');

export const postService = {
  async canPostToday() {
    const user = Parse.User.current();
    if (!user) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = new Parse.Query(Post);
    query.equalTo('author', user);
    query.greaterThanOrEqualTo('createdAt', today);
    const count = await query.count();
    return count === 0;
  },

  async createPost({ caption, hashtags, location, image, category }) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');

    const canPost = await this.canPostToday();
    if (!canPost) throw new Error('You already posted today. Come back tomorrow!');

    const post = new Post();
    post.set('author', user);
    post.set('authorId', user.id);
    post.set('authorUsername', user.get('username'));
    post.set('authorProfilePic', user.get('profilePicture')?.url() || null);
    post.set('caption', caption || '');
    post.set('hashtags', hashtags || []);
    post.set('location', location || '');
    post.set('category', category || 'moment');
    post.set('contentType', image ? (caption ? 'image_caption' : 'image') : 'text');
    post.set('reactionCounts', { like: 0, dislike: 0, sad: 0, funny: 0, wow: 0, love: 0, fire: 0, mindblown: 0 });
    post.set('commentCount', 0);

    if (image) {
      const parseFile = new Parse.File(image.name, image);
      await parseFile.save();
      post.set('image', parseFile);
    }

    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    post.setACL(acl);

    const result = await post.save();
    await this._updateStreak(user);
    return result.toJSON();
  },

  async deletePost(postId) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    const post = await new Parse.Query(Post).get(postId);
    if (post.get('author').id !== user.id) throw new Error('Not your post');
    // Best-effort cleanup — don't let it block the actual delete
    try { await this._cleanupPostDeps(postId); } catch (e) {
      console.warn('[Aura] Cleanup skipped:', e.message);
    }
    await post.destroy();
  },

  async editPost(postId, { caption, hashtags, location, category }) {
    const post = await new Parse.Query(Post).get(postId);
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    if (post.get('author').id !== user.id) throw new Error('Not your post');
    if (caption !== undefined) post.set('caption', caption);
    if (hashtags !== undefined) post.set('hashtags', hashtags);
    if (location !== undefined) post.set('location', location);
    if (category !== undefined) post.set('category', category);
    await post.save();
    return post.toJSON();
  },

  async _updateStreak(user) {
    const lastPost = user.get('lastPostDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastPost) {
      const last = new Date(lastPost);
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.increment('streakCount');
      } else if (diffDays > 1) {
        user.set('streakCount', 1);
      }
    } else {
      user.set('streakCount', 1);
    }
    const streak = user.get('streakCount') || 1;
    const longest = user.get('longestStreak') || 0;
    if (streak > longest) user.set('longestStreak', streak);
    user.set('lastPostDate', today);
    await user.save();
  },

  async _cleanupPostDeps(postId) {
    const Reaction = Parse.Object.extend('Reaction');
    const Comment = Parse.Object.extend('Comment');
    const rQuery = new Parse.Query(Reaction);
    rQuery.equalTo('post', Post.createWithoutData(postId));
    rQuery.limit(500);
    const reactions = await rQuery.find();
    if (reactions.length) await Parse.Object.destroyAll(reactions);
    const cQuery = new Parse.Query(Comment);
    cQuery.equalTo('post', Post.createWithoutData(postId));
    cQuery.limit(500);
    const comments = await cQuery.find();
    if (comments.length) await Parse.Object.destroyAll(comments);
  },

  async cleanupExpiredPosts() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const query = new Parse.Query(Post);
    query.lessThan('createdAt', cutoff);
    query.limit(100);
    try {
      const expiredPosts = await query.find();
      if (expiredPosts.length === 0) return 0;
      for (const post of expiredPosts) {
        await this._cleanupPostDeps(post.id);
      }
      await Parse.Object.destroyAll(expiredPosts);
      console.log(`[Aura] Cleaned up ${expiredPosts.length} expired posts`);
      return expiredPosts.length;
    } catch (err) {
      console.error('[Aura] Cleanup error:', err);
      return 0;
    }
  },

  async getFeed({ sort = 'recent', skip = 0, limit = 20 } = {}) {
    const query = new Parse.Query(Post);
    query.include('author');
    query.skip(skip);
    query.limit(limit);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    query.greaterThan('createdAt', cutoff);

    switch (sort) {
      case 'recent': query.descending('createdAt'); break;
      case 'oldest': query.ascending('createdAt'); break;
      case 'popular': query.descending('createdAt'); break;
      default: query.descending('createdAt');
    }

    const results = await query.find();
    if (results.length === 0) return [];

    // Batch-fetch reactions and comments for all posts at once.
    // Wrapped in try/catch so a CLP/permission error degrades gracefully
    // instead of crashing the whole feed.
    const Reaction = Parse.Object.extend('Reaction');
    const Comment = Parse.Object.extend('Comment');
    const currentUser = Parse.User.current();
    const postPointers = results.map((p) => Post.createWithoutData(p.id));

    let allReactions = [];
    let allComments = [];

    try {
      const rq = new Parse.Query(Reaction);
      rq.containedIn('post', postPointers);
      rq.limit(1000);
      allReactions = await rq.find();
    } catch (e) {
      console.warn('[Aura] Could not fetch reactions batch:', e.message);
    }

    try {
      const cq = new Parse.Query(Comment);
      cq.containedIn('post', postPointers);
      cq.limit(2000);
      allComments = await cq.find();
    } catch (e) {
      console.warn('[Aura] Could not fetch comments batch:', e.message);
    }

    // Build lookup maps keyed by post ID
    const reactionMap = {};
    const userReactionMap = {};
    const commentCountMap = {};

    allReactions.forEach((r) => {
      const pid = r.get('post').id;
      const type = r.get('type');
      if (!reactionMap[pid]) reactionMap[pid] = {};
      reactionMap[pid][type] = (reactionMap[pid][type] || 0) + 1;
      if (currentUser && r.get('user')?.id === currentUser.id) {
        userReactionMap[pid] = type;
      }
    });

    allComments.forEach((c) => {
      const pid = c.get('post').id;
      commentCountMap[pid] = (commentCountMap[pid] || 0) + 1;
    });

    return results.map((p) => {
      const author = p.get('author');
      return {
        ...p.toJSON(),
        reactionCounts: reactionMap[p.id] || {},
        commentCount: commentCountMap[p.id] || 0,
        userReaction: userReactionMap[p.id] || null,
        authorData: {
          objectId: p.get('authorId') || author?.id,
          username: p.get('authorUsername') || author?.get('username') || 'unknown',
          profilePicture: p.get('authorProfilePic') || author?.get('profilePicture')?.url() || null,
          status: author?.get('status') || null,
        },
      };
    });
  },

  async getUserPosts(userId) {
    const userPointer = Parse.User.createWithoutData(userId);
    const query = new Parse.Query(Post);
    query.equalTo('author', userPointer);
    query.descending('createdAt');
    query.include('author');
    const results = await query.find();
    return results.map((p) => {
      const author = p.get('author');
      return {
        ...p.toJSON(),
        authorData: {
          objectId: p.get('authorId') || author?.id,
          username: p.get('authorUsername') || author?.get('username') || 'unknown',
          profilePicture: p.get('authorProfilePic') || author?.get('profilePicture')?.url() || null,
        },
      };
    });
  },

  async react(postId, reactionType) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    const Reaction = Parse.Object.extend('Reaction');

    // Check for existing reaction by this user on this post
    const existingQuery = new Parse.Query(Reaction);
    existingQuery.equalTo('post', Post.createWithoutData(postId));
    existingQuery.equalTo('user', user);
    const existing = await existingQuery.first();

    let userReaction = reactionType;

    if (existing) {
      const oldType = existing.get('type');
      if (oldType === reactionType) {
        // Toggle off
        await existing.destroy();
        userReaction = null;
      } else {
        // Switch reaction type
        existing.set('type', reactionType);
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setWriteAccess(user, true);
        existing.setACL(acl);
        await existing.save();
      }
    } else {
      // New reaction
      const reaction = new Reaction();
      reaction.set('post', Post.createWithoutData(postId));
      reaction.set('user', user);
      reaction.set('type', reactionType);
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setWriteAccess(user, true);
      reaction.setACL(acl);
      await reaction.save();
    }

    // Compute fresh counts from the Reaction collection (source of truth)
    const countQuery = new Parse.Query(Reaction);
    countQuery.equalTo('post', Post.createWithoutData(postId));
    countQuery.limit(1000);
    const allReactions = await countQuery.find();

    const counts = {};
    allReactions.forEach((r) => {
      const t = r.get('type');
      counts[t] = (counts[t] || 0) + 1;
    });

    return { counts, userReaction };
  },

  async getUserReaction(postId) {
    const user = Parse.User.current();
    if (!user) return null;
    const Reaction = Parse.Object.extend('Reaction');
    const query = new Parse.Query(Reaction);
    query.equalTo('post', Post.createWithoutData(postId));
    query.equalTo('user', user);
    const existing = await query.first();
    return existing ? existing.get('type') : null;
  },
};
