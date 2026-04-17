// routes/admin.js
// ─────────────────────────────────────────────
// GET  /admin/users          — paginated user list
// GET  /admin/stats          — dashboard totals
// POST /admin/update-plan    — upgrade / downgrade
// POST /admin/block-user     — block or unblock
// POST /admin/grant-admin    — make another user admin (superadmin only)
// ─────────────────────────────────────────────

const router  = require('express').Router();
const { auth, db } = require('../config/firebase');
const { requireAdmin, grantAdminRole } = require('../middleware/requireAdmin');
const { resolveUserPlan } = require('../utils/subscriptionUtils');
const { PLANS } = require('../utils/plans');

router.use(requireAdmin);

// ── helpers ──────────────────────────────────

function serializeUser(doc) {
  const d = doc.data();
  const { effectivePlan, trialActive, trialDaysLeft, trialExpired } = resolveUserPlan(d);
  return {
    uid:           doc.id,
    email:         d.email         || '',
    businessName:  d.businessName  || '',
    plan:          d.plan          || 'free',
    effectivePlan,
    isTrialActive: trialActive,
    trialExpired,
    trialDaysLeft,
    trialEndsAt:   d.trialEndsAt   || null,
    invoicesCount: d.invoicesCount || 0,
    isBlocked:     d.isBlocked     || false,
    role:          d.role          || 'user',
    createdAt:     d.createdAt     || null,
    upgradedAt:    d.upgradedAt    || null,
  };
}

// ── GET /admin/stats ─────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const snap = await db.collection('users').get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const total       = users.length;
    const paid        = users.filter(u => u.plan === 'basic' || u.plan === 'pro').length;
    const onTrial     = users.filter(u => {
      const { trialActive } = resolveUserPlan(u);
      return trialActive;
    }).length;
    const blocked     = users.filter(u => u.isBlocked).length;
    const totalRevMRR = users.reduce((s, u) => {
      const price = PLANS[u.plan]?.price || 0;
      return s + price;
    }, 0);

    res.json({ total, paid, onTrial, blocked, mrr: totalRevMRR });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// ── GET /admin/users ─────────────────────────
// Query params: ?limit=50&plan=pro&search=name&blocked=true
router.get('/users', async (req, res) => {
  try {
    const { limit = 100, plan, blocked, search } = req.query;

    let query = db.collection('users').orderBy('createdAt', 'desc').limit(Number(limit));

    const snap = await query.get();
    let users = snap.docs.map(serializeUser);

    // Client-side filters (Firestore free tier avoids composite index costs)
    if (plan)    users = users.filter(u => u.plan === plan || u.effectivePlan === plan);
    if (blocked) users = users.filter(u => u.isBlocked === (blocked === 'true'));
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.businessName.toLowerCase().includes(q)
      );
    }

    res.json({ users, total: users.length });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ── POST /admin/update-plan ──────────────────
// Body: { uid, plan: "free"|"basic"|"pro" }
router.post('/update-plan', async (req, res) => {
  const { uid, plan } = req.body;

  if (!uid || !plan) return res.status(400).json({ error: 'uid and plan required.' });
  if (!PLANS[plan])  return res.status(400).json({ error: `Invalid plan. Valid: ${Object.keys(PLANS).join(', ')}` });

  try {
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found.' });

    const prev = snap.data().plan || 'free';

    await ref.update({
      plan,
      isTrialActive: false, // admin override ends trial
      updatedByAdmin: true,
      updatedAt: new Date().toISOString(),
      [`planHistory.${Date.now()}`]: { from: prev, to: plan, by: req.uid },
    });

    // Audit log
    await db.collection('adminLogs').add({
      action: 'update-plan',
      targetUid: uid,
      by: req.uid,
      payload: { from: prev, to: plan },
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, uid, plan, message: `Plan updated: ${prev} → ${plan}` });
  } catch (err) {
    console.error('[admin/update-plan]', err);
    res.status(500).json({ error: 'Plan update failed.' });
  }
});

// ── POST /admin/block-user ───────────────────
// Body: { uid, block: true | false, reason?: string }
router.post('/block-user', async (req, res) => {
  const { uid, block, reason = '' } = req.body;

  if (!uid || block === undefined) return res.status(400).json({ error: 'uid and block required.' });

  try {
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found.' });

    // Disable / enable Firebase Auth account
    await auth.updateUser(uid, { disabled: Boolean(block) });

    // Update Firestore
    await ref.update({
      isBlocked:   Boolean(block),
      blockedAt:   block ? new Date().toISOString() : null,
      blockReason: block ? reason : null,
      blockedBy:   block ? req.uid : null,
    });

    // Audit log
    await db.collection('adminLogs').add({
      action: block ? 'block-user' : 'unblock-user',
      targetUid: uid,
      by: req.uid,
      payload: { reason },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      uid,
      isBlocked: Boolean(block),
      message: block ? `User blocked.` : `User unblocked.`,
    });
  } catch (err) {
    console.error('[admin/block-user]', err);
    res.status(500).json({ error: 'Block action failed.' });
  }
});

// ── POST /admin/grant-admin ──────────────────
// Body: { uid }  — requires superadmin (admin.super === true)
router.post('/grant-admin', async (req, res) => {
  if (!req.admin.super) {
    return res.status(403).json({ error: 'Super-admin required.' });
  }
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required.' });

  try {
    await grantAdminRole(uid);
    res.json({ success: true, uid, message: 'Admin role granted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to grant admin role.' });
  }
});

// ── DEFAULT PLAN CONFIGS ─────────────────────
const DEFAULT_PLANS = [
  { key: 'free',  name: 'Free',  price: 0,  invoiceLimit: 20,   features: ['20 invoices/mo'] },
  { key: 'basic', name: 'Basic', price: 12, invoiceLimit: null, features: ['Unlimited invoices'] },
  { key: 'pro',   name: 'Pro',   price: 25, invoiceLimit: null, features: ['Unlimited', 'Reports', 'Multi-user'] },
];

// ── GET /admin/plans ─────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const snap = await db.collection('plans').get();
    if (snap.empty) return res.json(DEFAULT_PLANS);
    const plans = snap.docs.map(d => ({ key: d.id, ...d.data() }));
    // Merge: fill in any missing keys from defaults
    const keys = plans.map(p => p.key);
    for (const dp of DEFAULT_PLANS) {
      if (!keys.includes(dp.key)) plans.push(dp);
    }
    res.json(plans);
  } catch (err) {
    console.error('[admin/plans GET]', err);
    res.status(500).json({ error: 'Failed to load plans.' });
  }
});

// ── PATCH /admin/plans/:planKey ──────────────
// Body: { price?, invoiceLimit?, features? }
router.patch('/plans/:planKey', async (req, res) => {
  const { planKey } = req.params;
  const { price, invoiceLimit, features } = req.body;
  try {
    const ref  = db.collection('plans').doc(planKey);
    const snap = await ref.get();
    const base = snap.exists ? snap.data() : (DEFAULT_PLANS.find(p => p.key === planKey) || {});
    const updated = {
      ...base,
      key: planKey,
      ...(price        !== undefined && { price }),
      ...(invoiceLimit !== undefined && { invoiceLimit }),
      ...(features     !== undefined && { features }),
      updatedAt: new Date().toISOString(),
    };
    await ref.set(updated, { merge: true });
    res.json(updated);
  } catch (err) {
    console.error('[admin/plans PATCH]', err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

// ── GET /admin/messages ──────────────────────
// Query: ?read=true|false|all
router.get('/messages', async (req, res) => {
  try {
    const { read } = req.query;
    let query = db.collection('messages').orderBy('createdAt', 'desc').limit(50);
    const snap = await query.get();
    let messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (read === 'true')  messages = messages.filter(m => m.read === true);
    if (read === 'false') messages = messages.filter(m => m.read === false);
    res.json({ messages });
  } catch (err) {
    console.error('[admin/messages GET]', err);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// ── PATCH /admin/messages/:id ────────────────
// Body: { read: true }
router.patch('/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { read } = req.body;
  try {
    await db.collection('messages').doc(id).update({ read: Boolean(read) });
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/messages PATCH]', err);
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

// ── GET /admin/pages ─────────────────────────
router.get('/pages', async (req, res) => {
  try {
    const snap = await db.collection('pages').get();
    const pages = snap.docs.map(d => ({ slug: d.id, ...d.data() }));
    res.json({ pages });
  } catch (err) {
    console.error('[admin/pages GET]', err);
    res.status(500).json({ error: 'Failed to load pages.' });
  }
});

// ── GET /admin/pages/:slug ───────────────────
router.get('/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const snap = await db.collection('pages').doc(slug).get();
    if (!snap.exists) return res.status(404).json({ error: 'Page not found.' });
    res.json({ slug, ...snap.data() });
  } catch (err) {
    console.error('[admin/pages/:slug GET]', err);
    res.status(500).json({ error: 'Failed to load page.' });
  }
});

// ── PUT /admin/pages/:slug ───────────────────
// Body: { title, body }
router.put('/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  const { title, body } = req.body;
  try {
    const doc = {
      slug,
      title: title || '',
      body:  body  || '',
      updatedAt: new Date().toISOString(),
    };
    await db.collection('pages').doc(slug).set(doc, { merge: true });
    res.json(doc);
  } catch (err) {
    console.error('[admin/pages PUT]', err);
    res.status(500).json({ error: 'Failed to save page.' });
  }
});

module.exports = router;
