// Local development entry point.
// In production (Vercel) the serverless function at /api/index.js
// imports { app } from ./app.js directly — this file is NOT used there.
const { app } = require('./app')

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`\n✦ Xisaabaati API  →  http://localhost:${PORT}`)
  console.log(`  Health          →  http://localhost:${PORT}/health\n`)
})
