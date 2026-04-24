// ─────────────────────────────────────────────
//  plans.js  —  single source of truth for
//  all plan limits, features, and pricing
// ─────────────────────────────────────────────

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    invoiceLimit: 20,
    reports: false,
    expenses: false,
    multiUser: false,
    description: 'Get started with the basics',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    annualPrice: 6.3,
    invoiceLimit: Infinity,
    reports: true,
    expenses: true,
    multiUser: false,
    description: 'For small businesses',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 19,
    annualPrice: 13.3,
    invoiceLimit: Infinity,
    reports: true,
    expenses: true,
    multiUser: false,
    description: 'For growing businesses',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    annualPrice: 27.3,
    invoiceLimit: Infinity,
    reports: true,
    expenses: true,
    multiUser: true,
    description: 'Full power, no limits',
  },
};

const TRIAL_DAYS = 14;
const TRIAL_INVOICE_LIMIT = 50;
const EXTRA_USER_PRICE = 2.5;

module.exports = { PLANS, TRIAL_DAYS, TRIAL_INVOICE_LIMIT, EXTRA_USER_PRICE };
