require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')

const invoiceRoutes        = require('./routes/invoices')
const customerRoutes       = require('./routes/customers')
const reportRoutes         = require('./routes/reports')
const subscriptionRoutes   = require('./routes/subscription')
const adminRoutes          = require('./routes/admin')
const paymentRoutes        = require('./routes/payments')
const messagesPublicRoute  = require('./routes/messages-public')

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'https://xisaabaati.com', 'https://www.xisaabaati.com'],
  credentials: true,
}))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_, res) =>
  res.json({ status: 'ok', service: 'xisaabaati-api', time: new Date().toISOString() })
)

app.use('/api/invoices',     invoiceRoutes)
app.use('/api/customers',    customerRoutes)
app.use('/api/reports',      reportRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/payments',     paymentRoutes)
app.use('/api/messages',     messagesPublicRoute)
app.use('/admin',            adminRoutes)

app.use((_, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {
  console.error('Unhandled:', err)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = { app }
