// ─────────────────────────────────────────────
//  subscriptionUtils.js
//  Core helpers for plan resolution and trial
// ─────────────────────────────────────────────

const { PLANS, TRIAL_DAYS, TRIAL_INVOICE_LIMIT } = require('./plans');

/**
 * Resolve the *effective* plan for a user.
 *
 * Rules:
 *  1. If trial is still active  → treat as "pro"
 *  2. If trial expired          → demote to user.plan (usually "free")
 *  3. Always return a valid PLANS entry
 *
 * @param {object} user  – Firestore user doc data
 * @returns {{ effectivePlan, planConfig, trialDaysLeft, trialExpired }}
 */
function resolveUserPlan(user) {
  const now = new Date();
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

  const trialActive =
    user.isTrialActive === true &&
    trialEndsAt !== null &&
    trialEndsAt > now;

  const trialExpired =
    user.isTrialActive === true &&
    trialEndsAt !== null &&
    trialEndsAt <= now;

  const trialDaysLeft = trialActive
    ? Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))
    : 0;

  const effectivePlan = trialActive ? 'pro' : (user.plan || 'free');
  const planConfig = PLANS[effectivePlan] || PLANS.free;

  return {
    effectivePlan,
    planConfig,
    trialActive,
    trialExpired,
    trialDaysLeft,
    trialEndsAt,
  };
}

/**
 * Build the initial subscription fields for a brand-new user.
 * Called during signup.
 */
function buildInitialSubscription() {
  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  return {
    plan: 'free',               // base plan after trial
    isTrialActive: true,
    trialEndsAt: trialEndsAt.toISOString(),
    invoicesCount: 0,
    createdAt: now.toISOString(),
  };
}

/**
 * Check whether a user has exceeded the invoice limit for their
 * effective plan. Also handles the bonus: force-end trial at 50 invoices.
 *
 * @returns {{ allowed: boolean, reason: string | null, forceEndTrial: boolean }}
 */
function checkInvoiceAllowed(user) {
  const { effectivePlan, planConfig, trialActive } = resolveUserPlan(user);
  const current = user.invoicesCount || 0;

  // BONUS: force-end trial if user hits TRIAL_INVOICE_LIMIT
  if (trialActive && current >= TRIAL_INVOICE_LIMIT) {
    return {
      allowed: false,
      forceEndTrial: true,
      reason: `Trial ended early — you created ${TRIAL_INVOICE_LIMIT} invoices. Please upgrade to continue.`,
    };
  }

  // Normal limit check
  if (planConfig.invoiceLimit !== Infinity && current >= planConfig.invoiceLimit) {
    return {
      allowed: false,
      forceEndTrial: false,
      reason: `You've reached the ${planConfig.invoiceLimit}-invoice limit on the ${planConfig.name} plan. Please upgrade.`,
    };
  }

  return { allowed: true, forceEndTrial: false, reason: null };
}

module.exports = { resolveUserPlan, buildInitialSubscription, checkInvoiceAllowed };
