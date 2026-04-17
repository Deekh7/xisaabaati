# ✦ Xisaabaati — Cloud Accounting for Somalia

> **خساباتي** | **Xisaabaati** | نظام محاسبة سحابي للشركات الصغيرة الصومالية

A mobile-first SaaS accounting system built specifically for Somali merchants.  
Supports **Somali**, **Arabic (RTL)**, and **English**.

---

## Table of Contents

1. [What's Included](#whats-included)
2. [Architecture](#architecture)
3. [Quick Start — Local Development](#quick-start)
4. [Firebase Setup](#firebase-setup)
5. [Deployment](#deployment)
6. [Plans & Pricing](#plans--pricing)
7. [Payment Flow](#payment-flow)
8. [Admin Access](#admin-access)
9. [Environment Variables](#environment-variables)
10. [Firestore Rules & Indexes](#firestore-rules--indexes)
11. [Project Structure](#project-structure)

---

## What's Included

### Frontend (React 18 + Vite)

| Screen | Route | Description |
|---|---|---|
| Login | `/login` | Phone number + PIN — 3-step flow |
| Signup | `/signup` | Business name + phone + type + PIN |
| Dashboard | `/` | Revenue today, weekly chart, recent invoices |
| Invoices | `/invoices` | Create, edit, delete, WhatsApp share, limit bar |
| Customers | `/customers` | Add, edit, debt tracking |
| Reports | `/reports` | Weekly/monthly charts — Pro only |
| Team | `/team` | Invite members — Pro + extraUsers |
| Payment | `/payment` | 4-step payment flow for upgrading |
| Admin | `/admin` | Payments tab + Users tab |

### Backend (Node.js + Express + Firebase Admin)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Health check |
| GET | `/api/subscription/status` | user | Plan + trial info |
| POST | `/api/subscription/upgrade` | user | Direct upgrade (no payment) |
| POST | `/api/subscription/cancel` | user | Revert to Free |
| POST | `/api/subscription/add-users` | user | Add extra users |
| GET | `/api/invoices` | user | List invoices |
| POST | `/api/invoices` | user | Create invoice (limit enforced) |
| PUT | `/api/invoices/:id` | user | Update invoice |
| DELETE | `/api/invoices/:id` | user | Delete invoice |
| GET | `/api/customers` | user | List customers |
| POST | `/api/customers` | user | Create customer |
| GET | `/api/reports/summary` | user+Pro | Revenue summary |
| POST | `/api/payments/submit` | user | Submit payment proof |
| GET | `/api/payments/my` | user | Own payment history |
| GET | `/api/payments/pending` | admin | Pending queue |
| GET | `/api/payments/all` | admin | Full history |
| POST | `/api/payments/approve` | admin | Approve → auto-upgrade plan |
| POST | `/api/payments/reject` | admin | Reject with reason |
| POST | `/api/payments/evc/initiate` | user | EVC Plus stub |
| GET | `/api/payments/stats` | admin | Payment totals |
| GET | `/admin/users` | admin | List all users |
| GET | `/admin/stats` | admin | User totals |
| POST | `/admin/update-plan` | admin | Change user plan |
| POST | `/admin/block-user` | admin | Block/unblock user |
| POST | `/admin/grant-admin` | admin | Grant admin claim |

---

## Architecture

```
xisaabaati/
├── frontend/          React 18 + Vite — deployed to Firebase Hosting
├── backend/           Node.js + Express — deployed to Railway / Render
├── firestore.rules    Security rules — deployed with firebase deploy
├── firestore.indexes.json   Composite indexes
└── firebase.json      Firebase project config
```

**Data flow:**
```
User Phone + PIN
     ↓
Firebase Auth (fakeEmail pattern: {phone}@xisaabaati.app)
     ↓
React Frontend ←→ Express Backend (JWT via Firebase Admin SDK)
                        ↓
                   Cloud Firestore
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (see below)

### 1. Clone and install

```bash
# Frontend
cd frontend
npm install
cp .env.example .env
# → Fill in Firebase config values

# Backend
cd backend
npm install
cp .env.example .env
# → Fill in Firebase Admin SDK values
```

### 2. Start development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

### 3. Create your first admin

```bash
cd backend
node scripts/grantAdmin.js your-phone@xisaabaati.app
# Sign out of the app and sign back in for the admin claim to take effect
```

---

## Firebase Setup

### Step 1 — Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `xisaabaati`
3. Disable Google Analytics (not needed)

### Step 2 — Enable Authentication

1. Go to **Authentication → Sign-in method**
2. Enable **Email/Password** (used for phone+PIN flow via fake emails)
3. Optional: Enable **Phone** for SMS verification later

### Step 3 — Create Firestore Database

1. Go to **Firestore Database → Create database**
2. Choose **Production mode**
3. Select region: `europe-west1` (closest to Somalia) or `us-central1`

### Step 4 — Deploy Rules & Indexes

```bash
firebase login
firebase use --add   # select your project
firebase deploy --only firestore
```

### Step 5 — Get Web App Config (for frontend .env)

1. **Project Settings → Your apps → Add app → Web**
2. Copy the `firebaseConfig` object values to `frontend/.env`

### Step 6 — Get Admin SDK (for backend .env)

1. **Project Settings → Service Accounts → Generate new private key**
2. Open the downloaded JSON file
3. Copy `project_id`, `private_key`, `client_email` to `backend/.env`

---

## Deployment

### Frontend → Firebase Hosting

```bash
cd frontend
npm run build            # creates frontend/dist/
firebase deploy --only hosting
```

**Custom domain:** In Firebase Console → Hosting → Add custom domain → `app.xisaabaati.so`

### Backend → Railway (Recommended)

1. Push backend folder to a GitHub repo
2. Connect repo to [Railway.app](https://railway.app)
3. Set all environment variables from `backend/.env.example`
4. Railway auto-detects Node.js and deploys on every push
5. Copy the Railway URL → set as `VITE_API_URL` in frontend `.env`

**Or → Render.com:**

1. New Web Service → connect GitHub repo
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add environment variables

**Or → Google Cloud Run:**

```bash
cd backend
gcloud run deploy xisaabaati-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="$(cat .env | tr '\n' ',')"
```

### Update CORS for production

In `backend/.env`:
```
ALLOWED_ORIGINS=https://app.xisaabaati.so
```

---

## Plans & Pricing

| Plan | Price | Invoices | Reports | Multi-user |
|---|---|---|---|---|
| **Free** | $0 | 20/mo | — | — |
| **Basic** | $12/mo | Unlimited | — | — |
| **Pro** | $25/mo | Unlimited | ✓ | ✓ |
| Extra user | +$2.5/user/mo | — | — | Pro only |

### Trial

- Every new signup → **14-day Pro trial** (automatic, no card needed)
- Trial ends → user falls to Free plan
- If user creates **50 invoices during trial** → trial force-ends early
- Trial status shown in **TrialBanner** (4 states: healthy / warning / expired / force-ended)

---

## Payment Flow

Somalia-market payment system with manual verification:

```
User clicks "Upgrade"
       ↓
PaywallModal → navigates to /payment?plan=pro
       ↓
Step 1: Choose plan + extra users
Step 2: Choose method (Manual WhatsApp / EVC Plus / Zaad / Sahal)
Step 3: See payment number + instructions → submit phone + reference
       ↓
Firestore: payments/{id} = { status: "pending", uid, plan, amount, ... }
       ↓
Admin sees notification in Admin Panel → Payments tab
       ↓
Admin clicks "Approve" → Backend calls /api/payments/approve
       ↓
Firestore: users/{uid}.plan = "pro"  +  payments/{id}.status = "approved"
       ↓
User refreshes /payment → sees "Plan Activated!" 🎉
```

**Payment methods wired:**
- ✅ **Manual WhatsApp** — user sends money, screenshots to admin
- 🔧 **EVC Plus** — stub ready, needs API credentials from Hormuud
- 🔧 **Zaad** — stub ready, needs API credentials from Telesom
- 🔧 **Sahal** — stub ready, needs API credentials from Somtel

---

## Admin Access

### Grant admin to a user

```bash
cd backend
node scripts/grantAdmin.js 252610000000@xisaabaati.app
```

The user must sign out and sign back in for the custom claim to take effect.

### Admin capabilities

- **Payments tab**: approve/reject pending payments, full history
- **Users tab**: view all users, change plans, block/unblock accounts
- **Grant admin**: via CLI script

---

## Environment Variables

### backend/.env

```env
PORT=3001
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
ALLOWED_ORIGINS=https://app.xisaabaati.so
ADMIN_WHATSAPP=25261XXXXXXX
ADMIN_PHONE_DISPLAY=+252 61 XXX XXXX
EVC_API_KEY=
EVC_MERCHANT_ID=
```

### frontend/.env

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_URL=https://api.xisaabaati.so
VITE_ADMIN_WHATSAPP=25261XXXXXXX
```

---

## Firestore Rules & Indexes

### Deploy rules and indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Collections used

| Collection | Who writes | Who reads |
|---|---|---|
| `users` | Auth SDK + backend | Owner + admin |
| `invoices` | User (via backend) | Owner |
| `customers` | User (via backend) | Owner |
| `payments` | User (create), admin (update) | Owner + admin |
| `adminNotifications` | Backend (Admin SDK) | Admin only |
| `adminLogs` | Backend (Admin SDK) | Admin only |

---

## Project Structure

```
xisaabaati-fixed/
│
├── firebase.json                 Firebase project config
├── firestore.rules               Security rules (deploy with firebase)
├── firestore.indexes.json        Composite indexes (deploy with firebase)
│
├── frontend/
│   ├── .env.example             Copy → .env, fill values
│   ├── index.html               PWA meta, fonts
│   ├── vite.config.js           Dev proxy + build config
│   ├── package.json
│   └── src/
│       ├── main.jsx             Provider tree: Lang > Auth > Subscription
│       ├── App.jsx              All routes
│       ├── index.css            Global design system (730 lines)
│       │
│       ├── context/
│       │   ├── AuthContext.jsx           signup/login/logout + profile
│       │   ├── LangContext.jsx           EN/SO/AR + RTL
│       │   └── SubscriptionContext.jsx   plan, trial, limits, upgrade
│       │
│       ├── hooks/
│       │   ├── useFirestore.js   Firestore CRUD hooks
│       │   └── useLimitGuard.js  guard('invoice'|'reports', fn)
│       │
│       ├── components/
│       │   ├── AppLayout.jsx        Nav + TrialBanner + PaywallModal
│       │   ├── InvoiceModal.jsx     Create/edit invoice form
│       │   ├── LangSwitcher.jsx     EN/SO/AR toggle
│       │   ├── PaywallModal.jsx     Plan picker → navigates to /payment
│       │   ├── SendViaWhatsApp.jsx  WhatsApp share sheet (3 languages)
│       │   └── TrialBanner.jsx      Trial status (4 states)
│       │
│       ├── pages/
│       │   ├── LoginPage.jsx    Phone + PIN + business type
│       │   ├── SignupPage.jsx   Phone + business + PIN
│       │   ├── DashboardPage.jsx
│       │   ├── InvoicesPage.jsx   + limit bar + WhatsApp button
│       │   ├── CustomersPage.jsx  + debt tracking
│       │   ├── ReportsPage.jsx    Pro-gated + recharts
│       │   ├── TeamPage.jsx       Pro+extraUsers — invite flow
│       │   ├── PaymentPage.jsx    4-step: plan→method→pay→status
│       │   └── AdminPage.jsx      Payments tab + Users tab
│       │
│       ├── i18n/translations.js  EN + SO + AR string keys
│       ├── utils/helpers.js      formatCurrency, BIZ_TYPES, helpers
│       └── config/firebase.js    Firebase SDK init
│
└── backend/
    ├── .env.example
    ├── package.json
    ├── scripts/
    │   └── grantAdmin.js        node scripts/grantAdmin.js email
    └── src/
        ├── index.js             Express app + all routes registered
        ├── config/firebase.js   Admin SDK init
        │
        ├── middleware/
        │   ├── auth.js                requireAuth — JWT verify
        │   ├── requireAdmin.js        requireAdmin — custom claim
        │   ├── checkInvoiceLimit.js   blocks create at plan limit
        │   └── checkReportsAccess.js  blocks /reports for Free/Basic
        │
        ├── routes/
        │   ├── invoices.js      CRUD + checkInvoiceLimit + counter
        │   ├── customers.js     CRUD
        │   ├── reports.js       checkReportsAccess + summary
        │   ├── subscription.js  status / upgrade / cancel / add-users
        │   ├── payments.js      submit/my/pending/all/approve/reject/evc
        │   └── admin.js         users/stats/update-plan/block/grant-admin
        │
        └── utils/
            ├── plans.js             PLANS config, EXTRA_USER_PRICE
            └── subscriptionUtils.js resolveUserPlan, checkInvoiceAllowed
```

---

## Customisation Checklist Before Launch

- [ ] Replace `+252 61 XXX XXXX` with real admin WhatsApp in `PaymentPage.jsx`
- [ ] Replace `+252 61 XXX XXXX` with real number in `backend/.env` (`ADMIN_WHATSAPP`)
- [ ] Fill real EVC/Zaad/Sahal merchant numbers in `PaymentPage.jsx` `PAYMENT_NUMBERS`
- [ ] Update `VITE_API_URL` in frontend `.env` to production backend URL
- [ ] Update `ALLOWED_ORIGINS` in backend `.env` to production frontend domain
- [ ] Run `firebase deploy --only firestore` to deploy rules + indexes
- [ ] Run `node scripts/grantAdmin.js` to create first admin user
- [ ] Set `NODE_ENV=production` in backend `.env`

---

*Built for Somalia. Works on any Android or iPhone. Somali · Arabic · English.*
