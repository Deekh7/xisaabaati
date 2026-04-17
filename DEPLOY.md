# Xisaabaati — Deploy Runbook

Complete step-by-step guide to push the project live at **xisaabaati.com**.

---

## Prerequisites
- Node.js 18+ installed locally
- Git installed
- Accounts on: **GitHub**, **Firebase Console**, **Vercel**
- Domain `xisaabaati.com` registered (Namecheap, GoDaddy, etc.)

---

## Step 1 — Create Firebase Project

1. Go to https://console.firebase.google.com → **Add project** → name it `xisaabaati`
2. Enable **Google Analytics** (optional but useful)
3. **Authentication** → Sign-in method → enable **Email/Password**
4. **Firestore Database** → Create database → choose region `europe-west1` or `us-central1`
   - Start in **Production mode** (the `firestore.rules` file in this repo handles security)
5. **Project Settings** → **Service Accounts** → **Generate new private key** → download JSON

### 1a. Get the Web SDK config

**Project Settings → General → Your apps → Add app → Web**
Copy the `firebaseConfig` object — you will need these 6 values for Vercel env vars.

### 1b. Deploy Firestore rules & indexes

```bash
npm install -g firebase-tools
firebase login
cd /path/to/xisaabaati
firebase use --add          # select your project
firebase deploy --only firestore
```

---

## Step 2 — Push code to GitHub

```bash
cd /Users/mohammedyousef/Desktop/xisaabaati
git init
git add .
git commit -m "Initial production release"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/xisaabaati.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel

1. Go to https://vercel.com/new → **Import Git Repository** → select `xisaabaati`
2. Vercel will auto-detect `vercel.json` — no framework preset needed
3. **Environment Variables** — add ALL of the following:

### Frontend (VITE_*) vars
| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | from step 1a |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from step 1a |
| `VITE_FIREBASE_APP_ID` | from step 1a |
| `VITE_BOOTSTRAP_ADMIN_EMAIL` | `admin@xisaabaati.com` (your founding admin email) |
| `VITE_ADMIN_WHATSAPP` | `252XXXXXXXXX` |
| `VITE_ADMIN_WHATSAPP_DISPLAY` | `+252 XX XXX XXXX` |

### Backend vars
| Key | Value |
|-----|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire** service-account JSON as one line |
| `ALLOWED_ORIGINS` | `https://xisaabaati.com,https://www.xisaabaati.com` |
| `NODE_ENV` | `production` |

4. Click **Deploy** — Vercel will build and publish.

---

## Step 4 — Attach domain xisaabaati.com

1. In Vercel: **Project → Settings → Domains → Add** → type `xisaabaati.com`
2. Vercel shows you DNS records to add (usually an A record and a CNAME for `www`)
3. Go to your domain registrar's DNS settings and add those records
4. Wait 5–60 minutes for DNS propagation
5. Vercel auto-provisions an SSL certificate (Let's Encrypt)

---

## Step 5 — Create the admin account

1. Open https://xisaabaati.com → **Sign Up**
2. Register with the **exact email** you put in `VITE_BOOTSTRAP_ADMIN_EMAIL`
3. On successful signup, that account gets `role: "admin"` in Firestore automatically
4. Log in → the **Admin** tab now appears in the bottom nav
5. Remove or change `VITE_BOOTSTRAP_ADMIN_EMAIL` in Vercel after the admin account exists (re-deploy)

### Manually promote an existing user (alternative)

If you already have an account and need to promote it:

```bash
cd /Users/mohammedyousef/Desktop/xisaabaati/backend
node scripts/grantAdmin.js admin@xisaabaati.com
```

This sets `role: "admin"` in Firestore AND sets Firebase custom claims `{ admin: true, super: true }`.

---

## Step 6 — Verify everything works

| Check | Expected |
|-------|----------|
| https://xisaabaati.com loads | Landing / login page, green brand |
| Register new user | Redirected to dashboard |
| Create invoice | Saved to Firestore, counter increments |
| Admin account → Admin tab visible | Other accounts → Admin tab hidden |
| https://xisaabaati.com/api/health | `{"status":"ok","service":"xisaabaati-api"}` |
| Console — zero errors | Firebase connected, no missing env warnings |

---

## Summary of all changed/created files

| File | What changed |
|------|-------------|
| `frontend/vite.config.js` | JSX in .js files, esbuild loader |
| `frontend/src/config/firebase.js` | Tolerates missing env, exports `isFirebaseConfigured` |
| `frontend/src/context/AuthContext.jsx` | `role` field on signup, `isAdmin` in context, bootstrap admin email |
| `frontend/src/App.jsx` | `AdminRoute` guard — redirects non-admins away from `/admin` |
| `frontend/src/components/AppLayout.jsx` | Admin nav item only shown to admins |
| `frontend/src/i18n/translations.js` | Removed duplicate `upgradeNow`/`trialDaysLeft`/`trialExpired` keys |
| `backend/src/app.js` | NEW — Express app extracted, exports `{ app }` |
| `backend/src/index.js` | Now imports from app.js, only calls `listen()` |
| `backend/src/config/firebase.js` | Accepts `FIREBASE_SERVICE_ACCOUNT` JSON string |
| `api/index.js` | NEW — Vercel serverless entry wrapping Express app |
| `vercel.json` | NEW — build, output dir, rewrites, caching |
| `frontend/.env.example` | Added `VITE_BOOTSTRAP_ADMIN_EMAIL` |
| `backend/.env.example` | Added `FIREBASE_SERVICE_ACCOUNT` option |
