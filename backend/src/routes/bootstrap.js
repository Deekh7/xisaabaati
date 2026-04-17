// routes/bootstrap.js
// ─────────────────────────────────────────────
// ONE-TIME setup endpoint to grant initial admin claim.
// Protected by BOOTSTRAP_SECRET env var.
// Remove this route after first use.
// ─────────────────────────────────────────────

const router = require('express').Router()
const { auth, db } = require('../config/firebase')

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || 'xisaabaati-bootstrap-9k2mQpL7'

router.post('/', async (req, res) => {
  const { secret, email } = req.body || {}

  if (!secret || secret !== BOOTSTRAP_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (!email) {
    return res.status(400).json({ error: 'email required' })
  }

  try {
    const userRecord = await auth.getUserByEmail(email)
    await auth.setCustomUserClaims(userRecord.uid, { admin: true, super: true })
    await db.collection('users').doc(userRecord.uid).set(
      { role: 'admin', email: userRecord.email },
      { merge: true }
    )

    res.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      message: 'Admin custom claim granted. Sign out and back in for it to take effect.',
    })
  } catch (err) {
    console.error('[bootstrap]', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
