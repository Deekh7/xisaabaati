// routes/messages-public.js
// ─────────────────────────────────────────────
// POST /api/messages  — public contact form (no auth required)
// ─────────────────────────────────────────────

const router = require('express').Router();
const { db } = require('../config/firebase');

// POST /api/messages
router.post('/', async (req, res) => {
  const { name, phone = '', email = '', subject = '', body } = req.body;

  if (!name || !body) {
    return res.status(400).json({ error: 'name and body are required.' });
  }

  try {
    await db.collection('messages').add({
      name,
      phone,
      email,
      subject,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[messages-public POST]', err);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

module.exports = router;
