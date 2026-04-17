// routes/payments.js
// ─────────────────────────────────────────────
// Payment flow for Somalia market:
//   Manual (WhatsApp proof screenshot)
//   EVC Plus — structure ready for live integration
//
// POST /api/payments/submit       → user submits payment
// GET  /api/payments/my           → user checks their payments
// GET  /api/payments/pending      → admin: list pending
// GET  /api/payments/all          → admin: list all
// POST /api/payments/approve      → admin: approve → upgrade plan
// POST /api/payments/reject       → admin: reject with reason
// POST /api/payments/evc/initiate → (future) EVC Plus API call
// ─────────────────────────────────────────────

const router = require('express').Router();
const { db, auth } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { PLANS, EXTRA_USER_PRICE } = require('../utils/plans');
const admin = require('firebase-admin');

/* ── helpers ── */
function calcTotal(plan, extraUsers = 0) {
  const base = PLANS[plan]?.price || 0;
  const extra = plan === 'pro' ? (extraUsers * (EXTRA_USER_PRICE || 2.5)) : 0;
  return +(base + extra).toFixed(2);
}

function buildPaymentDoc(uid, data) {
  const now = new Date().toISOString();
  return {
    uid,
    plan:        data.plan,
    extraUsers:  data.extraUsers || 0,
    totalAmount: calcTotal(data.plan, data.extraUsers || 0),
    method:      data.method || 'manual',      // 'manual' | 'evc' | 'zaad' | 'sahal'
    phoneUsed:   data.phoneUsed || '',          // phone used for payment
    proofNote:   data.proofNote || '',          // whatsapp confirmation note / tx ID
    status:      'pending',                     // pending | approved | rejected
    createdAt:   now,
    updatedAt:   now,
    reviewedBy:  null,
    reviewedAt:  null,
    rejectReason: null,
    evcTxId:     data.evcTxId || null,          // for future EVC API
  };
}

/* ──────────────────────────────────────────────
   USER ROUTES  (requireAuth)
────────────────────────────────────────────── */
router.use('/my',     requireAuth);
router.use('/submit', requireAuth);

// POST /api/payments/submit
// Body: { plan, extraUsers?, method, phoneUsed, proofNote }
router.post('/submit', async (req, res) => {
  const { plan, extraUsers = 0, method = 'manual', phoneUsed, proofNote } = req.body;

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan.', valid: Object.keys(PLANS) });
  }
  if (plan === 'free') {
    return res.status(400).json({ error: 'Free plan needs no payment.' });
  }
  if (!phoneUsed && method !== 'evc') {
    return res.status(400).json({ error: 'phoneUsed is required for manual payments.' });
  }

  try {
    // Block if user already has a pending payment for this plan
    const existing = await db.collection('payments')
      .where('uid', '==', req.uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({
        error: 'You already have a pending payment. Wait for admin approval.',
        paymentId: existing.docs[0].id,
      });
    }

    const doc = buildPaymentDoc(req.uid, { plan, extraUsers, method, phoneUsed, proofNote });
    const ref = await db.collection('payments').add(doc);

    // Notify admin via Firestore trigger (or polling)
    await db.collection('adminNotifications').add({
      type: 'new_payment',
      paymentId: ref.id,
      uid: req.uid,
      plan,
      totalAmount: doc.totalAmount,
      method,
      createdAt: doc.createdAt,
      read: false,
    });

    res.status(201).json({
      success: true,
      paymentId: ref.id,
      status: 'pending',
      totalAmount: doc.totalAmount,
      message: 'Payment submitted. Admin will verify and upgrade your plan within a few hours.',
    });
  } catch (err) {
    console.error('[payments/submit]', err);
    res.status(500).json({ error: 'Failed to submit payment.' });
  }
});

// GET /api/payments/my — user checks own payment history
router.get('/my', async (req, res) => {
  try {
    const snap = await db.collection('payments')
      .where('uid', '==', req.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const payments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ payments });
  } catch (err) {
    console.error('[payments/my]', err);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

/* ──────────────────────────────────────────────
   ADMIN ROUTES  (requireAdmin)
────────────────────────────────────────────── */

// GET /api/payments/pending — admin: list pending payments
router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('payments')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')   // oldest first → serve in order
      .get();

    const payments = await Promise.all(snap.docs.map(async d => {
      const p = { id: d.id, ...d.data() };
      // Enrich with user info
      const userSnap = await db.collection('users').doc(p.uid).get();
      if (userSnap.exists) {
        const u = userSnap.data();
        p.businessName = u.businessName || '';
        p.userEmail    = u.email        || '';
        p.currentPlan  = u.plan         || 'free';
      }
      return p;
    }));

    res.json({ payments, count: payments.length });
  } catch (err) {
    console.error('[payments/pending]', err);
    res.status(500).json({ error: 'Failed to fetch pending payments.' });
  }
});

// GET /api/payments/all — admin: full history with filters
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let q = db.collection('payments').orderBy('createdAt', 'desc').limit(Number(limit));
    if (status) q = q.where('status', '==', status);
    const snap = await q.get();
    const payments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ payments, count: payments.length });
  } catch (err) {
    console.error('[payments/all]', err);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// POST /api/payments/approve
// Body: { paymentId }
router.post('/approve', requireAdmin, async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required.' });

  try {
    const payRef = db.collection('payments').doc(paymentId);
    const paySnap = await payRef.get();
    if (!paySnap.exists) return res.status(404).json({ error: 'Payment not found.' });

    const payment = paySnap.data();
    if (payment.status !== 'pending') {
      return res.status(409).json({ error: `Payment already ${payment.status}.` });
    }

    const now = new Date().toISOString();

    // 1. Update payment doc
    await payRef.update({
      status:     'approved',
      reviewedBy: req.uid,
      reviewedAt: now,
      updatedAt:  now,
    });

    // 2. Upgrade user plan in Firestore
    await db.collection('users').doc(payment.uid).update({
      plan:              payment.plan,
      extraUsers:        payment.extraUsers || 0,
      isTrialActive:     false,
      upgradedAt:        now,
      lastPaymentId:     paymentId,
      lastPaymentAmount: payment.totalAmount,
      totalMonthlyPrice: payment.totalAmount,
    });

    // 3. Audit log
    await db.collection('adminLogs').add({
      action:    'payment_approved',
      paymentId,
      targetUid: payment.uid,
      plan:      payment.plan,
      amount:    payment.totalAmount,
      by:        req.uid,
      timestamp: now,
    });

    // 4. Mark notification as read
    const notifSnap = await db.collection('adminNotifications')
      .where('paymentId', '==', paymentId).limit(1).get();
    if (!notifSnap.empty) await notifSnap.docs[0].ref.update({ read: true });

    res.json({
      success: true,
      message: `Payment approved. User upgraded to ${payment.plan.toUpperCase()}.`,
      uid:     payment.uid,
      plan:    payment.plan,
    });
  } catch (err) {
    console.error('[payments/approve]', err);
    res.status(500).json({ error: 'Approval failed.' });
  }
});

// POST /api/payments/reject
// Body: { paymentId, reason }
router.post('/reject', requireAdmin, async (req, res) => {
  const { paymentId, reason = 'Payment could not be verified.' } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required.' });

  try {
    const payRef  = db.collection('payments').doc(paymentId);
    const paySnap = await payRef.get();
    if (!paySnap.exists) return res.status(404).json({ error: 'Payment not found.' });
    if (paySnap.data().status !== 'pending') {
      return res.status(409).json({ error: `Payment already ${paySnap.data().status}.` });
    }

    const now = new Date().toISOString();
    await payRef.update({
      status:       'rejected',
      rejectReason: reason,
      reviewedBy:   req.uid,
      reviewedAt:   now,
      updatedAt:    now,
    });

    await db.collection('adminLogs').add({
      action: 'payment_rejected', paymentId,
      targetUid: paySnap.data().uid, reason, by: req.uid, timestamp: now,
    });

    res.json({ success: true, message: 'Payment rejected.' });
  } catch (err) {
    console.error('[payments/reject]', err);
    res.status(500).json({ error: 'Rejection failed.' });
  }
});

/* ──────────────────────────────────────────────
   EVC PLUS — future integration stub
   When EVC Plus API becomes available:
   1. Replace the stub with real API call
   2. Handle callback webhook from EVC
   3. Auto-approve on successful callback
────────────────────────────────────────────── */
router.post('/evc/initiate', requireAuth, async (req, res) => {
  const { plan, extraUsers = 0, phone } = req.body;
  if (!plan || !phone) return res.status(400).json({ error: 'plan and phone required.' });

  // TODO: Replace with real EVC Plus API when credentials available
  // const evcRes = await fetch('https://api.evcplus.com/v1/payment', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${process.env.EVC_API_KEY}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     merchant_id: process.env.EVC_MERCHANT_ID,
  //     phone,
  //     amount: calcTotal(plan, extraUsers),
  //     reference: `XI-${req.uid.slice(-6)}-${Date.now()}`,
  //   }),
  // });
  // const evcData = await evcRes.json();

  // For now: create a pending payment and instruct user to confirm manually
  try {
    const doc = buildPaymentDoc(req.uid, {
      plan, extraUsers, method: 'evc', phoneUsed: phone,
      proofNote: 'EVC Plus payment initiated — awaiting confirmation',
    });
    const ref = await db.collection('payments').add(doc);

    res.json({
      success:    true,
      paymentId:  ref.id,
      status:     'pending',
      totalAmount: doc.totalAmount,
      instructions: [
        `Send $${doc.totalAmount} via EVC Plus to: 252-61-XXXXXXX`,
        `Use reference: XI-${ref.id.slice(-6).toUpperCase()}`,
        'Take a screenshot and send to WhatsApp: +252 XX XXX XXXX',
        'Your plan will be upgraded within 2 hours.',
      ],
      // evcSessionId: evcData.session_id,   // uncomment when live
    });
  } catch (err) {
    console.error('[payments/evc/initiate]', err);
    res.status(500).json({ error: 'Failed to initiate EVC payment.' });
  }
});

// GET /api/payments/stats — admin dashboard numbers
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('payments').get();
    const all  = snap.docs.map(d => d.data());
    res.json({
      total:    all.length,
      pending:  all.filter(p => p.status === 'pending').length,
      approved: all.filter(p => p.status === 'approved').length,
      rejected: all.filter(p => p.status === 'rejected').length,
      totalRevenue: all.filter(p => p.status === 'approved').reduce((s, p) => s + (p.totalAmount || 0), 0),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payment stats.' });
  }
});

module.exports = router;
