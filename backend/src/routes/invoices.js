const router = require('express').Router()
const { db }  = require('../config/firebase')
const { requireAuth }        = require('../middleware/auth')
const { checkInvoiceLimit }  = require('../middleware/checkInvoiceLimit')
const admin = require('firebase-admin')

router.use(requireAuth)

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    let q = db.collection('invoices')
      .where('uid', '==', req.uid)
      .orderBy('createdAt', 'desc')
      .limit(Number(limit))
    if (status) q = q.where('status', '==', status)
    const snap = await q.get()
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (err) {
    console.error('[invoices/get]', err)
    res.status(500).json({ error: 'Failed to fetch invoices.' })
  }
})

// POST /api/invoices — limit check applied here
router.post('/', checkInvoiceLimit, async (req, res) => {
  try {
    const data = {
      ...req.body,
      uid: req.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const ref = await db.collection('invoices').add(data)
    // Increment counter atomically
    await db.collection('users').doc(req.uid).update({
      invoicesCount: admin.firestore.FieldValue.increment(1),
    })
    res.status(201).json({ id: ref.id, ...data })
  } catch (err) {
    console.error('[invoices/create]', err)
    res.status(500).json({ error: 'Failed to create invoice.' })
  }
})

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const ref = db.collection('invoices').doc(req.params.id)
    const doc = await ref.get()
    if (!doc.exists || doc.data().uid !== req.uid)
      return res.status(404).json({ error: 'Not found.' })
    const data = { ...req.body, updatedAt: new Date().toISOString() }
    delete data.uid
    await ref.update(data)
    res.json({ id: req.params.id, ...doc.data(), ...data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice.' })
  }
})

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const ref = db.collection('invoices').doc(req.params.id)
    const doc = await ref.get()
    if (!doc.exists || doc.data().uid !== req.uid)
      return res.status(404).json({ error: 'Not found.' })
    await ref.delete()
    // Decrement counter (floor 0)
    const snap = await db.collection('users').doc(req.uid).get()
    if ((snap.data()?.invoicesCount || 0) > 0) {
      await db.collection('users').doc(req.uid).update({
        invoicesCount: admin.firestore.FieldValue.increment(-1),
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice.' })
  }
})

module.exports = router
