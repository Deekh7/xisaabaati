const router = require('express').Router();
const { db } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('customers')
      .where('uid', '==', req.uid)
      .orderBy('name', 'asc')
      .get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const data = {
      ...req.body,
      uid: req.uid,
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection('customers').add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const ref = db.collection('customers').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().uid !== req.uid) {
      return res.status(404).json({ error: 'Not found' });
    }
    const data = { ...req.body };
    delete data.uid;
    await ref.update(data);
    res.json({ id: req.params.id, ...doc.data(), ...data });
  } catch {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const ref = db.collection('customers').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().uid !== req.uid) {
      return res.status(404).json({ error: 'Not found' });
    }
    await ref.delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
