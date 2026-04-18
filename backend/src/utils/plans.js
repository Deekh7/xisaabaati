// ─────────────────────────────────────────────
//  plans.js  —  single source of truth for
//  all plan limits, features, and pricing
// ─────────────────────────────────────────────

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    invoiceLimit: 20,       // max invoices allowed
    reports: false,
    multiUser: false,
    description: 'Get started with the basics',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 12,
    invoiceLimit: Infinity, // unlimited
    reports: false,
    multiUser: false,
    description: 'For growing businesses',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 25,
    invoiceLimit: Infinity,
    reports: true,
    multiUser: true,
    description: 'Full power, no limits',
  },
};

const TRIAL_DAYS = 14;
const TRIAL_INVOICE_LIMIT = 50; // force-end trial if exceeded during trial
const EXTRA_USER_PRICE = 2.5;   // $ per extra user/month on Pro plan

module.exports = { PLANS, TRIAL_DAYS, TRIAL_INVOICE_LIMIT, EXTRA_USER_PRICE };
