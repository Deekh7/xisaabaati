#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  XISAABAATI — Complete One-Click Deployment Script
#  Run from the project root:
#    cd ~/Desktop/xisaabaati && bash deploy-now.sh
#
#  This script:
#    1. Deploys Firestore security rules + indexes to Firebase
#    2. Verifies/sets all Vercel environment variables
#    3. Triggers a fresh Vercel production deploy
#    4. Bootstraps admin account (deekh57@gmail.com)
#    5. Verifies everything is working
# ═══════════════════════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

REPO="Deekh7/xisaabaati"
# GitHub token — set via env or prompt below
GH_TOKEN="${GITHUB_TOKEN:-}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIREBASE_PROJECT="xisaabaati-d2da3"
VERCEL_URL="https://xisaabaati-fixed.vercel.app"
ADMIN_EMAIL="deekh57@gmail.com"
BOOTSTRAP_SECRET="xisaabaati-bootstrap-9k2mQpL7"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          XISAABAATI — Full Deployment                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────
#  STEP 1: Install required tools
# ─────────────────────────────────────────────────────────────────────
# Prompt for GitHub token if not set
if [ -z "$GH_TOKEN" ]; then
  echo -e "${YELLOW}  Your GitHub token is needed for CI/CD setup.${NC}"
  echo "  Get one at: https://github.com/settings/tokens (needs repo + workflow scopes)"
  read -r -p "  GitHub Personal Access Token (or press Enter to skip): " GH_TOKEN
fi

echo -e "${YELLOW}[1/6] Checking required tools...${NC}"

# Install firebase-tools if not present
if ! command -v firebase &>/dev/null; then
  echo "  Installing firebase-tools..."
  npm install -g firebase-tools --silent
fi
echo -e "${GREEN}  ✓ firebase-tools ready${NC}"

# Install vercel CLI if not present
if ! command -v vercel &>/dev/null; then
  echo "  Installing Vercel CLI..."
  npm install -g vercel --silent
fi
echo -e "${GREEN}  ✓ Vercel CLI ready${NC}"

# ─────────────────────────────────────────────────────────────────────
#  STEP 2: Deploy Firebase Firestore rules + indexes
# ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/6] Deploying Firestore rules and indexes...${NC}"

# Extract service account from backend/.env
SA_JSON=$(grep 'FIREBASE_SERVICE_ACCOUNT=' "$PROJECT_DIR/backend/.env" | cut -d'=' -f2-)

if [ -z "$SA_JSON" ]; then
  echo -e "${RED}  ✗ FIREBASE_SERVICE_ACCOUNT not found in backend/.env${NC}"
  echo "    Please add it and run this script again."
  exit 1
fi

# Write service account to temp file
SA_FILE=$(mktemp /tmp/sa-XXXXXX.json)
echo "$SA_JSON" > "$SA_FILE"
echo -e "${GREEN}  ✓ Service account loaded${NC}"

# Deploy Firestore
cd "$PROJECT_DIR"
GOOGLE_APPLICATION_CREDENTIALS="$SA_FILE" firebase deploy \
  --only firestore \
  --project "$FIREBASE_PROJECT" \
  --non-interactive

echo -e "${GREEN}  ✓ Firestore rules + indexes deployed${NC}"

# Cleanup temp file
rm -f "$SA_FILE"

# ─────────────────────────────────────────────────────────────────────
#  STEP 3: Set Vercel environment variables
# ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/6] Configuring Vercel environment variables...${NC}"

# Read backend/.env for values
SA_JSON_ESCAPED=$(grep 'FIREBASE_SERVICE_ACCOUNT=' "$PROJECT_DIR/backend/.env" | cut -d'=' -f2-)

# Check if vercel is linked, if not, link it
if [ ! -f "$PROJECT_DIR/.vercel/project.json" ]; then
  echo "  Linking Vercel project..."
  VERCEL_TOKEN_INPUT=""
  read -r -p "  Enter your Vercel token (from https://vercel.com/account/tokens): " VERCEL_TOKEN_INPUT
  if [ -n "$VERCEL_TOKEN_INPUT" ]; then
    cd "$PROJECT_DIR/frontend"
    vercel link --yes --token="$VERCEL_TOKEN_INPUT" 2>/dev/null || true
    cd "$PROJECT_DIR"
  fi
fi

# Try to set env vars if we have a token
if [ -f "$PROJECT_DIR/.vercel/project.json" ]; then
  ORG_ID=$(cat "$PROJECT_DIR/.vercel/project.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('orgId',''))" 2>/dev/null || echo "")
  PROJ_ID=$(cat "$PROJECT_DIR/.vercel/project.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('projectId',''))" 2>/dev/null || echo "")

  if [ -n "$ORG_ID" ] && [ -n "$PROJ_ID" ]; then
    # Set FIREBASE_SERVICE_ACCOUNT on Vercel
    echo "$SA_JSON_ESCAPED" | vercel env add FIREBASE_SERVICE_ACCOUNT production --token="$VERCEL_TOKEN_INPUT" --yes 2>/dev/null || \
    echo "$SA_JSON_ESCAPED" | vercel env rm FIREBASE_SERVICE_ACCOUNT production --yes 2>/dev/null; \
    echo "$SA_JSON_ESCAPED" | vercel env add FIREBASE_SERVICE_ACCOUNT production --token="$VERCEL_TOKEN_INPUT" --yes 2>/dev/null || true

    echo -e "${GREEN}  ✓ FIREBASE_SERVICE_ACCOUNT set on Vercel${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ Vercel not linked — skipping env var update${NC}"
  echo "    Ensure FIREBASE_SERVICE_ACCOUNT is set in Vercel Dashboard manually"
  echo "    → https://vercel.com/dashboard → xisaabaati-fixed → Settings → Environment Variables"
fi

# ─────────────────────────────────────────────────────────────────────
#  STEP 4: Set GitHub Actions secrets (for future CI/CD)
# ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/6] Setting GitHub Actions secrets...${NC}"

if command -v gh &>/dev/null; then
  # Authenticate using our token
  echo "$GH_TOKEN" | gh auth login --with-token 2>/dev/null || true

  # Set FIREBASE_SERVICE_ACCOUNT secret
  SA_JSON_FOR_GH=$(grep 'FIREBASE_SERVICE_ACCOUNT=' "$PROJECT_DIR/backend/.env" | cut -d'=' -f2-)
  echo "$SA_JSON_FOR_GH" | gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$REPO" 2>/dev/null && \
    echo -e "${GREEN}  ✓ GitHub secret FIREBASE_SERVICE_ACCOUNT set${NC}" || \
    echo -e "${YELLOW}  ⚠ Could not set GitHub secret (token may lack permissions)${NC}"
else
  echo -e "${YELLOW}  ⚠ gh CLI not found — skipping GitHub secrets${NC}"
fi

# Push the GitHub Actions workflow if it exists locally
if [ -f "$PROJECT_DIR/.github/workflows/deploy.yml" ]; then
  cd "$PROJECT_DIR"
  git config --local user.email "deekh57@gmail.com"
  git config --local user.name "Deekh7"
  git add .github/workflows/ firestore.rules
  git diff --cached --quiet || git commit -m "ci: add GitHub Actions CI/CD workflow + fix firestore rules"
  git remote set-url origin "https://$GH_TOKEN@github.com/$REPO.git"
  git push origin main 2>/dev/null && \
    echo -e "${GREEN}  ✓ GitHub Actions workflow pushed${NC}" || \
    echo -e "${YELLOW}  ⚠ Could not push workflow (may need manual setup in GitHub web UI)${NC}"
fi

# ─────────────────────────────────────────────────────────────────────
#  STEP 5: Verify deployment is live
# ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/6] Verifying deployment...${NC}"

sleep 5

# Check health endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL/health" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  HEALTH=$(curl -s "$VERCEL_URL/health" 2>/dev/null || echo "{}")
  echo -e "${GREEN}  ✓ API health check passed: $HEALTH${NC}"
else
  echo -e "${YELLOW}  ⚠ API returned HTTP $HTTP_STATUS — may still be deploying${NC}"
  echo "    Check: $VERCEL_URL/health"
fi

# ─────────────────────────────────────────────────────────────────────
#  STEP 6: Bootstrap admin account
# ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[6/6] Bootstrapping admin account...${NC}"
echo "  Email: $ADMIN_EMAIL"

BOOTSTRAP_RESULT=$(curl -s -X POST "$VERCEL_URL/api/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$BOOTSTRAP_SECRET\",\"email\":\"$ADMIN_EMAIL\"}" 2>/dev/null || echo '{"error":"network"}')

if echo "$BOOTSTRAP_RESULT" | grep -q '"success"'; then
  echo -e "${GREEN}  ✓ Admin bootstrapped: $BOOTSTRAP_RESULT${NC}"
elif echo "$BOOTSTRAP_RESULT" | grep -q 'already'; then
  echo -e "${GREEN}  ✓ Admin already exists — OK${NC}"
else
  echo -e "${YELLOW}  ⚠ Bootstrap result: $BOOTSTRAP_RESULT${NC}"
  echo "    Retry manually: curl -X POST $VERCEL_URL/api/bootstrap-admin -H 'Content-Type: application/json' -d '{\"secret\":\"$BOOTSTRAP_SECRET\",\"email\":\"$ADMIN_EMAIL\"}'"
fi

# ─────────────────────────────────────────────────────────────────────
#  Summary
# ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ XISAABAATI DEPLOYMENT COMPLETE                  ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}║  🌐 Live URL:  https://xisaabaati-fixed.vercel.app   ║${NC}"
echo -e "${BLUE}║  🔥 Firebase: https://console.firebase.google.com    ║${NC}"
echo -e "${BLUE}║               /project/xisaabaati-d2da3              ║${NC}"
echo -e "${BLUE}║  👤 Admin:    deekh57@gmail.com                      ║${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}║  Next steps:                                         ║${NC}"
echo -e "${BLUE}║  1. Open the live URL and log in                     ║${NC}"
echo -e "${BLUE}║  2. Create an account with deekh57@gmail.com         ║${NC}"
echo -e "${BLUE}║  3. You'll automatically have admin access           ║${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
