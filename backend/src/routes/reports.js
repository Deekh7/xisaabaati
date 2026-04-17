const router = require('express').Router()
const { db }  = require('../config/firebase')
const { requireAuth }         = require('../middleware/auth')
const { checkReportsAccess }  = require('../middleware/checkReportsAccess')

router.use(requireAuth)
router.use(checkReportsAccess) // blocks Free and Basic

// GET /api/reports/summary?period=week|month
router.get('/summary', async (req, res) => {
  try {
    const { period = 'month' } = req.query
    const now   = new Date()
    const start = new Date()
    if (period === 'week') { start.setDate(now.getDate() - 7) }
    else { start.setDate(1); start.setHours(0, 0, 0, 0) }

    const snap = await db.collection('invoices').where('uid', '==', req.uid).get()
    const invoices = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(inv => {
      const d = inv.createdAt?._seconds ? new Date(inv.createdAt._seconds * 1000) : new Date(inv.createdAt)
      return d >= start
    })

    res.json({
      period,
      revenue:      invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
      invoiceCount: invoices.length,
      paid:         invoices.filter(i => i.status === 'paid').length,
      unpaid:       invoices.filter(i => i.status !== 'paid').length,
    })
  } catch (err) {
    console.error('[reports/summary]', err)
    res.status(500).json({ error: 'Failed to generate report.' })
  }
})

module.exports = router
