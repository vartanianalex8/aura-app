import Parse from './parse';

export const streakFreezeService = {
  // Grant 1 free freeze at the start of each month if not already granted
  async grantMonthlyFreezeIfDue() {
    const user = Parse.User.current();
    if (!user) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastGrantMonth = user.get('lastFreezeGrantMonth');
    if (lastGrantMonth === monthKey) return; // already granted this month

    const current = user.get('freezesAvailable') || 0;
    user.set('freezesAvailable', current + 1);
    user.set('lastFreezeGrantMonth', monthKey);
    await user.save().catch(() => {});
  },

  getFreezesAvailable() {
    const user = Parse.User.current();
    if (!user) return 0;
    return user.get('freezesAvailable') || 0;
  },

  // Called by streak logic when a day is missed — returns true if freeze was used
  async tryUseFreeze() {
    const user = Parse.User.current();
    if (!user) return false;
    const available = user.get('freezesAvailable') || 0;
    if (available <= 0) return false;
    user.set('freezesAvailable', available - 1);
    user.set('lastFreezeUsedAt', new Date());
    await user.save().catch(() => {});
    return true;
  },

  // Add freezes (for future purchase flow)
  async addFreezes(count) {
    const user = Parse.User.current();
    if (!user) throw new Error('Not logged in');
    const current = user.get('freezesAvailable') || 0;
    user.set('freezesAvailable', current + count);
    await user.save();
  },
};
