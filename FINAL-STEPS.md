# Xisaabaati — Final 2 Steps to Go Live

> Run these commands from your computer terminal, inside the project folder.
> **Everything else is already done and deployed.**

---

## Step 1 — Deploy Firestore Security Rules (Critical)

This deploys the security rules that allow sales, products, and expenses to work.

```bash
cd ~/Desktop/xisaabaati

# Install Firebase CLI if you don't have it
npm install -g firebase-tools

# Deploy Firestore rules + indexes
bash deploy-now.sh
```

The script will:
- Read your service account from `backend/.env` automatically
- Deploy all Firestore rules and indexes to Firebase
- Bootstrap your admin account (deekh57@gmail.com)
- Confirm everything is live

---

## Step 2 — Verify the App Works

1. Open **https://xisaabaati-fixed.vercel.app**
2. Create an account with **deekh57@gmail.com**
3. You'll automatically have admin access
4. Go to **Admin panel** → verify user management works
5. Add a product, record a sale → verify data saves

---

## What's Already Live

| Component | Status | URL |
|-----------|--------|-----|
| Frontend (React) | ✅ Deployed | https://xisaabaati-fixed.vercel.app |
| Backend API | ✅ Deployed | https://xisaabaati-fixed.vercel.app/health |
| GitHub Repo | ✅ Up to date | https://github.com/Deekh7/xisaabaati |
| Firebase Project | ✅ Configured | xisaabaati-d2da3 |
| Firestore Rules | ⚠️ Need deploy | Run `bash deploy-now.sh` |

---

## Manual Commands (if script fails)

```bash
# Deploy Firebase rules manually
SA_JSON=$(grep 'FIREBASE_SERVICE_ACCOUNT=' backend/.env | cut -d'=' -f2-)
echo "$SA_JSON" > /tmp/sa.json
GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json firebase deploy \
  --only firestore \
  --project xisaabaati-d2da3 \
  --non-interactive
rm /tmp/sa.json

# Bootstrap admin account (after creating your account on the site)
curl -X POST https://xisaabaati-fixed.vercel.app/api/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"secret":"xisaabaati-bootstrap-9k2mQpL7","email":"deekh57@gmail.com"}'
```

---

*All code fixes applied, all files pushed to GitHub, Vercel auto-deploy triggered.*
*Only the Firebase rules deployment requires your local machine.*
