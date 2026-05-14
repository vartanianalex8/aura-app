import Parse from './parse';

const UserIndex = Parse.Object.extend('UserIndex');

// Creates or updates a public-readable UserIndex record for search.
// The _User class blocks public find queries (Back4App CLP security),
// so we maintain a separate searchable index.
async function syncUserIndex(user) {
  try {
    const q = new Parse.Query(UserIndex);
    q.equalTo('userId', user.id);
    let idx = await q.first().catch(() => null);
    if (!idx) {
      idx = new UserIndex();
      idx.set('userId', user.id);
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setWriteAccess(user, true);
      idx.setACL(acl);
    }
    const pic = user.get('profilePicture');
    idx.set('username', user.get('username') || '');
    idx.set('streakCount', user.get('streakCount') || 0);
    idx.set('longestStreak', user.get('longestStreak') || 0);
    idx.set('bio', user.get('bio') || '');
    idx.set('profilePictureUrl', pic ? (typeof pic.url === 'function' ? pic.url() : pic) : null);
    await idx.save();
  } catch (e) {
    console.warn('[Aura] UserIndex sync failed:', e.message);
  }
}

export const authService = {
  async signUp(username, email, password) {
    const user = new Parse.User();
    user.set('username', username);
    user.set('email', email);
    user.set('password', password);
    user.set('streakCount', 0);
    user.set('longestStreak', 0);
    user.set('badges', []);
    user.set('blockedUsers', []);
    user.set('savedPosts', []);
    user.set('lastPostDate', null);
    const result = await user.signUp();
    await syncUserIndex(result);
    return result.toJSON();
  },

  async logIn(identifier, password) {
    let result;
    const isEmail = identifier.includes('@');
    if (!isEmail) {
      result = await Parse.User.logIn(identifier, password);
    } else {
      // Try email lookup via UserIndex (since _User find is CLP-blocked)
      try {
        const q = new Parse.Query(Parse.User);
        q.equalTo('email', identifier.toLowerCase().trim());
        q.limit(1);
        const match = await q.first().catch(() => null);
        if (match) {
          result = await Parse.User.logIn(match.get('username'), password);
        }
      } catch { /* fall through */ }
      if (!result) {
        try {
          result = await Parse.User.logIn(identifier, password);
        } catch {
          throw new Error('Invalid email or password. Try your username instead.');
        }
      }
    }
    // Sync index on every login to keep streak/bio current
    await syncUserIndex(result);
    return result.toJSON();
  },

  async seedUserIndex() {
    const user = Parse.User.current();
    if (user) await syncUserIndex(user);
  },

  async logOut() {
    await Parse.User.logOut();
  },

  getCurrentUser() {
    const user = Parse.User.current();
    if (!user) return null;
    const json = user.toJSON();
    // Prefer the plain string field set on upload — never depends on Parse.File serialization
    const picUrl = json.profilePictureUrl || json.profilePicture?.url || null;
    json.profilePicture = picUrl ? { url: picUrl } : null;
    return json;
  },

  async resetPassword(email) {
    await Parse.User.requestPasswordReset(email);
  },

  async updateProfile(updates) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    Object.entries(updates).forEach(([key, value]) => user.set(key, value));
    await user.save();
    await syncUserIndex(user);
    return user.toJSON();
  },

  async uploadProfilePicture(file) {
    const parseFile = new Parse.File(file.name, file);
    await parseFile.save();
    const picUrl = parseFile.url(); // grab URL immediately while the file object is fresh
    const user = Parse.User.current();
    user.set('profilePicture', parseFile);
    user.set('profilePictureUrl', picUrl); // plain string — never depends on File serialization
    await user.save();
    await syncUserIndex(user);
    return user.toJSON();
  },
};
