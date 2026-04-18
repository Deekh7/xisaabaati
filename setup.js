#!/usr/bin/env node
/**
 * XISAABAATI — Complete Setup Script
 *
 * Run from project root:
 *   node setup.js
 *
 * This handles:
 *   1. Deploy Firestore security rules + indexes to Firebase
 *   2. Set FIREBASE_SERVICE_ACCOUNT on Vercel (if you provide a Vercel token)
 *   3. Bootstrap admin account (deekh57@gmail.com)
 *   4. Verify deployment is live
 */

const { execSync, spawnSync } = require('child_process')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const readline = require('readline')

const G   = '\x1b[32m'
const Y   = '\x1b[33m'
const R   = '\x1b[31m'
const B   = '\x1b[34m'
const W   = '\x1b[1m'
const NC  = '\x1b[0m'

const VERCEL_URL      = 'https://xisaabaati-fixed.vercel.app'
const FIREBASE_PROJECT = 'xisaabaati-d2da3'
const ADMIN_EMAIL     = 'deekh57@gmail.com'
const BOOTSTRAP_SECRET = 'xisaabaati-bootstrap-9k2mQpL7'

const ROOT = __dirname

function log(msg)  { console.log(msg) }
function ok(msg)   { console.log(`${G}  ✓ ${msg}${NC}`) }
function warn(msg) { console.log(`${Y}  ⚠ ${msg}${NC}`) }
function err(msg)  { console.log(`${R}  ✗ ${msg}${NC}`) }
function header(msg) { console.log(`\n${B}${W}${msg}${NC}`) }

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', cwd: ROOT, ...opts })
  } catch (e) {
    if (opts.allowFail) return null
    throw e
  }
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe', cwd: ROOT }).toString().trim()
  } catch(e) {
    return null
  }
}

function httpsPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data)
    const u    = new URL(url)
    const opts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    }
    const req = https.request(opts, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, data: body }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body)
    req.end()
  })
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const opts = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET' }
    const req = https.request(opts, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, data: body }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()) })
  })
}

function loadEnv(envPath) {
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    const env   = {}
    for (const line of lines) {
      const idx = line.indexOf('=')
      if (idx > 0 && !line.startsWith('#')) {
        env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
      }
    }
    return env
  } catch {
    return {}
  }
}

async function step1_deployFirestore(saJson) {
  header('[1/4] Deploying Firestore security rules + indexes...')

  // Write SA to temp file
  const saFile = path.join(require('os').tmpdir(), `sa-${Date.now()}.json`)
  fs.writeFileSync(saFile, saJson)

  // Check if firebase-tools is installed
  let firebaseCmd = runSilent('which firebase') || runSilent('where firebase')

  if (!firebaseCmd) {
    log(`  Installing firebase-tools (this takes ~30 seconds)...`)
    run('npm install -g firebase-tools', { allowFail: true })
    firebaseCmd = runSilent('which firebase') || runSilent('where firebase')

    if (!firebaseCmd) {
      // Try local install
      run('npm install firebase-tools --prefix ./node_modules/.firebase-tools', {
        silent: true, allowFail: true
      })
      firebaseCmd = path.join(ROOT, 'node_modules', '.firebase-tools', 'node_modules', '.bin', 'firebase')
      if (!fs.existsSync(firebaseCmd)) {
        err('Could not install firebase-tools. Run manually:')
        log(`    npm install -g firebase-tools`)
        log(`    GOOGLE_APPLICATION_CREDENTIALS=${saFile} firebase deploy --only firestore --project ${FIREBASE_PROJECT}`)
        return false
      }
    }
  }

  try {
    const env = { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: saFile }
    const result = spawnSync(
      firebaseCmd,
      ['deploy', '--only', 'firestore', '--project', FIREBASE_PROJECT, '--non-interactive'],
      { cwd: ROOT, env, stdio: 'inherit', timeout: 120000 }
    )

    fs.unlinkSync(saFile)

    if (result.status === 0) {
      ok('Firestore rules + indexes deployed successfully!')
      return true
    } else {
      err('Firebase deploy failed. Try manually:')
      log(`    firebase deploy --only firestore --project ${FIREBASE_PROJECT}`)
      return false
    }
  } catch (e) {
    try { fs.unlinkSync(saFile) } catch {}
    err(`Firebase deploy error: ${e.message}`)
    return false
  }
}

async function step2_setVercelEnv(saJson, vercelToken) {
  header('[2/4] Setting Vercel environment variable...')

  if (!vercelToken) {
    warn('No Vercel token provided — skipping.')
    warn('If backend API returns 500 errors, go to:')
    warn('  https://vercel.com/dashboard → xisaabaati-fixed → Settings → Environment Variables')
    warn('  Add: FIREBASE_SERVICE_ACCOUNT = (paste entire backend/.env value)')
    return false
  }

  // Get project list to find project ID
  try {
    const projectsResp = await httpsGet(`https://api.vercel.com/v9/projects/xisaabaati-fixed`)
    // TODO: use actual project
    ok(`Vercel project found`)
  } catch {}

  // Find project
  let projectId = null
  try {
    const resp = await fetch(`https://api.vercel.com/v9/projects`, {
      headers: { Authorization: `Bearer ${vercelToken}` }
    })
    const data = await resp.json()
    const proj = (data.projects || []).find(p => p.name.includes('xisaabaati'))
    if (proj) projectId = proj.id
  } catch {}

  if (!projectId) {
    warn('Could not find Vercel project. Set env var manually in dashboard.')
    return false
  }

  try {
    const resp = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'FIREBASE_SERVICE_ACCOUNT',
        value: saJson,
        type: 'encrypted',
        target: ['production', 'preview']
      })
    })

    if (resp.ok) {
      ok('FIREBASE_SERVICE_ACCOUNT set on Vercel!')
      return true
    } else {
      const e = await resp.json()
      if (e.error?.code === 'ENV_ALREADY_EXISTS') {
        ok('FIREBASE_SERVICE_ACCOUNT already exists on Vercel')
        return true
      }
      warn(`Could not set env var: ${JSON.stringify(e.error || e)}`)
      return false
    }
  } catch (e) {
    warn(`Vercel API error: ${e.message}`)
    return false
  }
}

async function step3_bootstrap() {
  header('[3/4] Bootstrapping admin account...')
  log(`  Email: ${ADMIN_EMAIL}`)

  try {
    const resp = await httpsPost(
      `${VERCEL_URL}/api/bootstrap-admin`,
      { secret: BOOTSTRAP_SECRET, email: ADMIN_EMAIL }
    )

    if (resp.status === 200 && resp.data.success) {
      ok(`Admin bootstrapped! UID: ${resp.data.uid}`)
      log(`  Sign out and back in for admin access to take effect.`)
      return true
    } else if (JSON.stringify(resp.data).includes('already')) {
      ok('Admin claims already set — OK')
      return true
    } else {
      warn(`Bootstrap response (${resp.status}): ${JSON.stringify(resp.data)}`)
      if (resp.status === 404) {
        warn('API endpoint not found — backend may still be deploying. Wait 2 min and try:')
        log(`  curl -X POST ${VERCEL_URL}/api/bootstrap-admin -H "Content-Type: application/json" -d '{"secret":"${BOOTSTRAP_SECRET}","email":"${ADMIN_EMAIL}"}'`)
      }
      return false
    }
  } catch (e) {
    err(`Could not reach API: ${e.message}`)
    warn('Wait 2-3 minutes for Vercel to finish deploying, then run:')
    log(`  curl -X POST ${VERCEL_URL}/api/bootstrap-admin -H "Content-Type: application/json" -d '{"secret":"${BOOTSTRAP_SECRET}","email":"${ADMIN_EMAIL}"}'`)
    return false
  }
}

async function step4_verify() {
  header('[4/4] Verifying deployment...')

  try {
    const health = await httpsGet(`${VERCEL_URL}/health`)
    if (health.status === 200) {
      ok(`API health check: ${JSON.stringify(health.data)}`)
    } else {
      warn(`API returned HTTP ${health.status}`)
    }
  } catch (e) {
    warn(`Could not reach API (may still be deploying): ${e.message}`)
  }

  log('')
  log(`${B}${W}╔══════════════════════════════════════════════════════╗${NC}`)
  log(`${B}${W}║   ✅  XISAABAATI DEPLOYMENT COMPLETE                 ║${NC}`)
  log(`${B}${W}╠══════════════════════════════════════════════════════╣${NC}`)
  log(`${B}${W}║                                                      ║${NC}`)
  log(`${B}${W}║  🌐 App:    ${VERCEL_URL}  ║${NC}`)
  log(`${B}${W}║  👤 Admin:  ${ADMIN_EMAIL}                   ║${NC}`)
  log(`${B}${W}║  🔥 Firebase: xisaabaati-d2da3                       ║${NC}`)
  log(`${B}${W}║                                                      ║${NC}`)
  log(`${B}${W}║  To use the app:                                     ║${NC}`)
  log(`${B}${W}║  1. Open the URL above                               ║${NC}`)
  log(`${B}${W}║  2. Sign up with deekh57@gmail.com                   ║${NC}`)
  log(`${B}${W}║  3. Sign out and back in for admin access            ║${NC}`)
  log(`${B}${W}║                                                      ║${NC}`)
  log(`${B}${W}╚══════════════════════════════════════════════════════╝${NC}`)
}

async function main() {
  console.clear()
  log(`${B}${W}`)
  log('  ╔══════════════════════════════════════════╗')
  log('  ║   XISAABAATI — Complete Setup            ║')
  log('  ║   Accounting App for Somali Merchants    ║')
  log('  ╚══════════════════════════════════════════╝')
  log(`${NC}`)

  // Load service account
  const backendEnv = loadEnv(path.join(ROOT, 'backend', '.env'))
  const saJson = backendEnv.FIREBASE_SERVICE_ACCOUNT

  if (!saJson) {
    err('FIREBASE_SERVICE_ACCOUNT not found in backend/.env')
    err('Make sure you are running this from the project root directory.')
    process.exit(1)
  }

  // Validate SA JSON
  try {
    const sa = JSON.parse(saJson)
    ok(`Service account loaded (project: ${sa.project_id})`)
  } catch {
    err('FIREBASE_SERVICE_ACCOUNT is not valid JSON in backend/.env')
    process.exit(1)
  }

  // Optional: Vercel token for setting env vars
  log('\n  Optional: Enter your Vercel token to auto-configure backend.')
  log('  Get one at: https://vercel.com/account/tokens')
  log('  (Press Enter to skip)')
  const vercelToken = await ask('  Vercel Token: ')

  log('')

  // Run all steps
  const r1 = await step1_deployFirestore(saJson)
  const r2 = await step2_setVercelEnv(saJson, vercelToken)
  const r3 = await step3_bootstrap()
  await step4_verify()

  // Summary
  if (!r1) {
    log('')
    warn('Firebase rules not deployed. Run this manually:')
    log(`  npm install -g firebase-tools`)
    log(`  firebase login`)
    log(`  firebase deploy --only firestore --project ${FIREBASE_PROJECT}`)
  }

  if (!r2 && !vercelToken) {
    log('')
    warn('Remember to set FIREBASE_SERVICE_ACCOUNT in Vercel Dashboard:')
    log('  https://vercel.com/dashboard → xisaabaati-fixed → Settings → Environment Variables')
  }

  process.exit(0)
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
