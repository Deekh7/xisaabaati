// middleware/requireAdmin.js
// ─────────────────────────────────────────────
// Checks Firebase Auth custom claim: { admin: true }
// Set this claim via Firebase Admin SDK (see INTEGRATION.md)
// ─────────────────────────────────────────────

const { auth, db } = require('../config/firebase');

async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify token and check custom claim
    const decoded = await auth.verifyIdToken(token);

    if (decoded.admin !== true) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    req.uid   = decoded.uid;
    req.admin = decoded;
    next();
  } catch (err) {
    console.error('[requireAdmin]', err.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Utility: grant admin role to a user (run once from a setup script)
async function grantAdminRole(uid) {
  await auth.setCustomUserClaims(uid, { admin: true });
  await db.collection('users').doc(uid).update({ role: 'admin' });
  console.log(`✓ Admin role granted to ${uid}`);
}

module.exports = { requireAdmin, grantAdminRole };
