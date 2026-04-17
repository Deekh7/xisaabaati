// ─────────────────────────────────────────────
//  checkReportsAccess.js  —  Express middleware
//  Blocks /api/reports for Free and Basic plans.
// ─────────────────────────────────────────────

const { db } = require('../config/firebase');
const { resolveUserPlan } = require('../utils/subscriptionUtils');

async function checkReportsAccess(req, res, next) {
  try {
    const snap = await db.collection('users').doc(req.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const { planConfig, effectivePlan } = resolveUserPlan(snap.data());

    if (!planConfig.reports) {
      return res.status(403).json({
        error: 'REPORTS_NOT_AVAILABLE',
        message: 'Reports are available on the Pro plan only.',
        code: 'UPGRADE_REQUIRED',
        currentPlan: effectivePlan,
      });
    }

    next();
  } catch (err) {
    console.error('[checkReportsAccess]', err);
    res.status(500).json({ error: 'Access check failed' });
  }
}

module.exports = { checkReportsAccess };
