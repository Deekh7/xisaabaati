// ─────────────────────────────────────────────
//  subscription.js  —  plan management routes
//
//  GET  /api/subscription/status  → full plan info
//  POST /api/subscription/upgrade → change plan
//  POST /api/subscription/cancel  → revert to free
// ─────────────────────────────────────────────

const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');
const { resolveUserPlan } = require('../utils/subscriptionUtils');
const { PLANS } = require('../utils/plans');

router.use(requireAuth);

// ── GET /api/subscription/status ─────────────
// Returns the user's current plan, trial status,
// days left, and plan feature flags.
router.get('/status', async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const user = snap.data();
    const {
      effectivePlan,
      planConfig,
      trialActive,
      trialExpired,
      trialDaysLeft,
      trialEndsAt,
    } = resolveUserPlan(user);

    // If trial just expired and doc hasn't been updated yet, patch it
    if (trialExpired && user.isTrialActive) {
      await db.collection('users').doc(req.uid).update({ isTrialActive: false });
    }

    res.json({
      uid: req.uid,
      plan: user.plan,
      effectivePlan,
      isTrialActive: trialActive,
      trialExpired,
      trialDaysLeft,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      trialForceEnded: user.trialForceEnded || false,
      invoicesCount: user.invoicesCount || 0,
      features: {
        invoiceLimit: planConfig.invoiceLimit === Infinity ? null : planConfig.invoiceLimit,
        reports: planConfig.reports,
        multiUser: planConfig.multiUser,
      },
      availablePlans: Object.values(PLANS).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        invoiceLimit: p.invoiceLimit === Infinity ? null : p.invoiceLimit,
        reports: p.reports,
        multiUser: p.multiUser,
        description: p.description,
      })),
    });
  } catch (err) {
    console.error('[subscription/status]', err);
    res.status(500).json({ error: 'Failed to fetch subscription status.' });
  }
});

// ── POST /api/subscription/upgrade ────────────
// Body: { plan: "basic" | "pro" }
//
// In production: verify payment here before upgrading.
// Integrate Stripe/EVC Plus webhook to confirm payment
// then call this endpoint internally.
router.post('/upgrade', async (req, res) => {
  const { plan } = req.body;

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({
      error: 'Invalid plan.',
      validPlans: Object.keys(PLANS),
    });
  }

  if (plan === 'free') {
    return res.status(400).json({ error: 'Use /cancel to revert to Free.' });
  }

  try {
    await db.collection('users').doc(req.uid).update({
      plan,
      isTrialActive: false,   // upgrade ends trial
      upgradedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      plan,
      message: `Successfully upgraded to ${PLANS[plan].name} plan.`,
    });
  } catch (err) {
    console.error('[subscription/upgrade]', err);
    res.status(500).json({ error: 'Upgrade failed.' });
  }
});

// ── POST /api/subscription/cancel ────────────
// Reverts user to Free plan immediately.
router.post('/cancel', async (req, res) => {
  try {
    await db.collection('users').doc(req.uid).update({
      plan: 'free',
      isTrialActive: false,
      cancelledAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Subscription cancelled. You are now on the Free plan.' });
  } catch (err) {
    console.error('[subscription/cancel]', err);
    res.status(500).json({ error: 'Cancellation failed.' });
  }
});

module.exports = router;
