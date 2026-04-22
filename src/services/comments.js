import Parse from './parse';

const Comment = Parse.Object.extend('Comment');
const Post = Parse.Object.extend('Post');

export const commentService = {
  async hasCommented(postId) {
    const user = Parse.User.current();
    if (!user) return false;
    const query = new Parse.Query(Comment);
    query.equalTo('post', Post.createWithoutData(postId));
    query.equalTo('author', user);
    const count = await query.count();
    return count > 0;
  },

  async addComment(postId, text, parentCommentId = null) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');

    const isGif = text.trim().startsWith('[gif:');
    if (!isGif) {
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount > 10) throw new Error('Comments must be 10 words or fewer');
    }

    const comment = new Comment();
    comment.set('post', Post.createWithoutData(postId));
    comment.set('author', user);
    comment.set('authorUsername', user.get('username'));
    comment.set('text', text.trim());

    if (parentCommentId) {
      comment.set('parent', Comment.createWithoutData(parentCommentId));
    }

    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    comment.setACL(acl);

    const result = await comment.save();

    return result.toJSON();
  },

  async getComments(postId) {
    const query = new Parse.Query(Comment);
    query.equalTo('post', Post.createWithoutData(postId));
    query.include('author');
    query.ascending('createdAt');
    const results = await query.find();
    return results.map((c) => {
      const author = c.get('author');
      return {
        ...c.toJSON(),
        authorData: {
          objectId: author?.id,
          username: c.get('authorUsername') || author?.get('username') || 'unknown',
          profilePicture: author?.get('profilePicture')?.url() || null,
        },
      };
    });
  },
};
