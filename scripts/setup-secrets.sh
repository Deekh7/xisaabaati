#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  XISAABAATI — One-Time GitHub Secrets Setup
#  Run ONCE from the project folder:
#    bash scripts/setup-secrets.sh
#
#  This sets GitHub Actions secrets so every git push
#  automatically deploys Firebase + Vercel with zero effort.
# ═══════════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

REPO="Deekh7/xisaabaati"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Xisaabaati — GitHub Secrets Setup         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Check gh CLI ──────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo -e "${RED}✗ GitHub CLI not found. Install:${NC}  brew install gh"
  exit 1
fi

gh auth status 2>/dev/null || gh auth login --web
echo -e "${GREEN}✓ GitHub authenticated${NC}"

# ─────────────────────────────────────────────────────────────
#  SECRET 1 — FIREBASE_SERVICE_ACCOUNT
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Setting FIREBASE_SERVICE_ACCOUNT...${NC}"

SA_JSON=$(grep 'FIREBASE_SERVICE_ACCOUNT=' "$PROJECT_DIR/backend/.env" | cut -d'=' -f2-)

if [ -n "$SA_JSON" ]; then
  echo "$SA_JSON" | gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$REPO"
  echo -e "${GREEN}✓ FIREBASE_SERVICE_ACCOUNT set from backend/.env${NC}"
else
  echo -e "${RED}Not found in backend/.env.${NC}"
  echo "  Download from: Firebase Console → Project Settings → Service Accounts"
  read -r -p "  Paste the full service account JSON (one line): " SA_JSON
  echo "$SA_JSON" | gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$REPO"
  echo -e "${GREEN}✓ FIREBASE_SERVICE_ACCOUNT set${NC}"
fi

# ─────────────────────────────────────────────────────────────
#  SECRETS 2-4 — VERCEL (Token + Org ID + Project ID)
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Setting Vercel secrets...${NC}"
echo ""
echo "  Get your Vercel token at: ${BLUE}https://vercel.com/account/tokens${NC}"
echo "  Get Org/Project IDs from: ${BLUE}cd $(pwd) && cat .vercel/project.json${NC}"
echo "  Or: vercel link --yes && cat .vercel/project.json"
echo ""

read -r -p "  Vercel Token (starts with 'v'): " VERCEL_TOKEN
read -r -p "  Vercel Org ID (orgId):         " VERCEL_ORG_ID
read -r -p "  Vercel Project ID (projectId): " VERCEL_PROJECT_ID

if [ -n "$VERCEL_TOKEN" ] && [ -n "$VERCEL_ORG_ID" ] && [ -n "$VERCEL_PROJECT_ID" ]; then
  echo "$VERCEL_TOKEN"      | gh secret set VERCEL_TOKEN      --repo "$REPO"
  echo "$VERCEL_ORG_ID"     | gh secret set VERCEL_ORG_ID     --repo "$REPO"
  echo "$VERCEL_PROJECT_ID" | gh secret set VERCEL_PROJECT_ID --repo "$REPO"
  echo -e "${GREEN}✓ Vercel secrets set${NC}"
else
  echo -e "${YELLOW}⚠ Vercel secrets skipped (Vercel auto-deploys via GitHub integration anyway)${NC}"
fi

# ─────────────────────────────────────────────────────────────
#  Trigger first deploy
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Triggering first automated deploy...${NC}"
cd "$PROJECT_DIR"
git commit --allow-empty -m "ci: trigger GitHub Actions deploy"
git push origin main
echo -e "${GREEN}✓ Deploy triggered — watch at: ${BLUE}https://github.com/$REPO/actions${NC}"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Setup complete!                         ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Every push to main now auto-deploys:        ║${NC}"
echo -e "${BLUE}║    ✓ Firebase Firestore rules + indexes      ║${NC}"
echo -e "${BLUE}║    ✓ Vercel production build                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
