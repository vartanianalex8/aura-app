/**
 * AURA — Wipe All Posts, Reactions, and Comments
 * Run: node wipe-all-posts.js
 */
const APP_ID = 'PIhre7k77l4LBsvtpgQDcYdscP7AWbEsjLvPFrNE';
const REST_KEY = 'IyAnxYWfHqjlxe2v7dPyCamryUJKTNwLlLfPVsHt';
const SERVER = 'https://parseapi.back4app.com';
const headers = {
  'X-Parse-Application-Id': APP_ID,
  'X-Parse-REST-API-Key': REST_KEY,
  'Content-Type': 'application/json',
};

async function deleteAllInClass(className) {
  let totalDeleted = 0;
  while (true) {
    const res = await fetch(`${SERVER}/classes/${className}?limit=100&keys=objectId`, { headers });
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) break;
    await Promise.all(results.map((obj) =>
      fetch(`${SERVER}/classes/${className}/${obj.objectId}`, { method: 'DELETE', headers })
    ));
    totalDeleted += results.length;
    console.log(`  Deleted ${totalDeleted} ${className} objects so far...`);
  }
  return totalDeleted;
}

async function main() {
  console.log('=== AURA DATA WIPE ===\n');
  for (const className of ['Comment', 'Reaction', 'Post']) {
    console.log(`Deleting all ${className} records...`);
    const count = await deleteAllInClass(className);
    console.log(`  Done: ${count} deleted\n`);
  }
  console.log('=== DONE! Feed is now empty. ===');
}

main().catch(console.error);
