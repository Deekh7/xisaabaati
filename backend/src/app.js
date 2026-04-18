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
const bootstrapRoute       = require('./routes/bootstrap')

const app = express()

app.use(helmet())
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://xisaabaati.com',
  'https://www.xisaabaati.com',
  'https://xisaabaati-fixed.vercel.app',
  'https://xisaabaati.vercel.app',
]
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : DEFAULT_ORIGINS

// Accept any *.vercel.app preview deploy + explicit list
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)                          // server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true) // explicit list
    if (origin.endsWith('.vercel.app')) return cb(null, true)  // any preview URL
    cb(new Error('Not allowed by CORS'))
  },
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
app.use('/api/bootstrap-admin', bootstrapRoute)

app.use((_, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {
  console.error('Unhandled:', err)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = { app }
