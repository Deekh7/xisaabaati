// scripts/grantAdmin.js
// ─────────────────────────────────────────────
// Run once to make your first admin user.
//
// Usage:
//   node scripts/grantAdmin.js user@example.com
// ─────────────────────────────────────────────

require('dotenv').config();
const { auth, db } = require('../src/config/firebase');

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/grantAdmin.js user@email.com');
    process.exit(1);
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(userRecord.uid, { admin: true, super: true });
    await db.collection('users').doc(userRecord.uid).update({ role: 'admin' });

    console.log(`✅ Admin role granted to: ${email} (${userRecord.uid})`);
    console.log('   The user must sign out and back in for the claim to take effect.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
