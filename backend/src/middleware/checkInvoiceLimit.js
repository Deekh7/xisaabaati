// ─────────────────────────────────────────────
//  checkInvoiceLimit.js  —  Express middleware
//  Blocks invoice creation when limit reached.
//  Also force-ends trial at 50 invoices (bonus).
// ─────────────────────────────────────────────

const { db } = require('../config/firebase');
const { checkInvoiceAllowed, resolveUserPlan } = require('../utils/subscriptionUtils');

async function checkInvoiceLimit(req, res, next) {
  try {
    const uid = req.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch latest user doc (always fresh — don't rely on JWT claims for billing)
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const user = snap.data();
    const { allowed, reason, forceEndTrial } = checkInvoiceAllowed(user);

    // BONUS: auto-expire trial when 50-invoice threshold hit
    if (forceEndTrial) {
      await db.collection('users').doc(uid).update({
        isTrialActive: false,
        trialForceEnded: true,
        trialForceEndedAt: new Date().toISOString(),
      });
      return res.status(403).json({
        error: 'TRIAL_FORCE_ENDED',
        message: reason,
        code: 'UPGRADE_REQUIRED',
      });
    }

    if (!allowed) {
      const { effectivePlan } = resolveUserPlan(user);
      return res.status(403).json({
        error: 'INVOICE_LIMIT_REACHED',
        message: reason,
        code: 'UPGRADE_REQUIRED',
        currentPlan: effectivePlan,
      });
    }

    // Attach resolved user data for use in route handler
    req.userData = user;
    next();
  } catch (err) {
    console.error('[checkInvoiceLimit]', err);
    res.status(500).json({ error: 'Subscription check failed' });
  }
}

module.exports = { checkInvoiceLimit };
