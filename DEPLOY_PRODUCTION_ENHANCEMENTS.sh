#!/bin/bash

###############################################################################
# BillHaven Production Enhancement Deployment Script
#
# This script deploys the production-ready security enhancements to your
# BillHaven deployment on Render and Vercel.
#
# WHAT IT DOES:
# 1. Backs up current files
# 2. Replaces with enhanced versions
# 3. Installs new dependencies (helmet)
# 4. Runs tests
# 5. Commits and pushes to production
#
# PREREQUISITES:
# - Git repository with remote configured
# - Node.js and npm installed
# - Access to push to main branch
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   BillHaven Production Enhancement Deployment Script      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in BillHaven root directory${NC}"
    echo "Please run this script from /home/elmigguel/BillHaven"
    exit 1
fi

# Step 1: Backup current files
echo -e "${YELLOW}📦 Step 1: Backing up current files...${NC}"
cp server/index.js server/index-backup-$(date +%Y%m%d-%H%M%S).js
cp vercel.json vercel-backup-$(date +%Y%m%d-%H%M%S).json
echo -e "${GREEN}✅ Backups created${NC}"

# Step 2: Install Helmet.js
echo -e "${YELLOW}📦 Step 2: Installing Helmet.js dependency...${NC}"
cd server
npm install helmet --save
cd ..
echo -e "${GREEN}✅ Helmet.js installed${NC}"

# Step 3: Replace files
echo -e "${YELLOW}🔄 Step 3: Replacing with enhanced versions...${NC}"
cp server/index-enhanced.js server/index.js
cp vercel-enhanced.json vercel.json
echo -e "${GREEN}✅ Files replaced${NC}"

# Step 4: Test locally (optional)
echo -e "${YELLOW}🧪 Step 4: Running local tests...${NC}"
read -p "Do you want to test locally before deploying? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting local server (Ctrl+C to stop when ready)..."
    cd server
    npm run dev &
    SERVER_PID=$!
    sleep 5

    # Test health endpoint
    echo "Testing health endpoint..."
    curl -s http://localhost:3001/health | jq '.'

    # Stop server
    kill $SERVER_PID
    cd ..
    echo -e "${GREEN}✅ Local tests completed${NC}"
else
    echo "Skipping local tests..."
fi

# Step 5: Git commit
echo -e "${YELLOW}📝 Step 5: Committing changes...${NC}"
git add server/index.js server/package.json server/package-lock.json vercel.json PRODUCTION_READINESS.md
git commit -m "feat: Add production security enhancements

🔒 Security improvements:
- Added Helmet.js security headers
- Implemented request ID tracking
- Added structured JSON logging
- Enhanced health check with diagnostics
- Improved rate limiting with cleanup
- Added HTTPS enforcement
- Configured Vercel security headers

📊 Monitoring improvements:
- Request duration tracking
- Performance metrics in health check
- Sensitive data filtering in logs
- Error handling middleware

🚀 Generated with Claude Code https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${GREEN}✅ Changes committed${NC}"

# Step 6: Push to production
echo -e "${YELLOW}🚀 Step 6: Pushing to production...${NC}"
read -p "Ready to push to production? This will deploy to Render and Vercel. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✅ Pushed to production${NC}"

    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              Deployment Status                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${GREEN}✅ Backend deploying to Render${NC}"
    echo "   Monitor: https://dashboard.render.com/"
    echo ""
    echo -e "${GREEN}✅ Frontend deploying to Vercel${NC}"
    echo "   Monitor: https://vercel.com/dashboard"
    echo ""

    # Wait for deployment
    echo "Waiting 60 seconds for deployment..."
    sleep 60

    # Test production health endpoint
    echo -e "${YELLOW}🧪 Testing production health endpoint...${NC}"
    curl -s https://billhaven.onrender.com/health | jq '.'

    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Verify health check returns 200 OK"
    echo "2. Set up Sentry DSN in Vercel environment variables"
    echo "3. Configure uptime monitoring (Better Uptime/UptimeRobot)"
    echo "4. Test payment flow end-to-end"
    echo "5. Review PRODUCTION_READINESS.md for full checklist"
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo -e "${YELLOW}⏸️  Deployment cancelled. Changes are committed but not pushed.${NC}"
    echo "Run 'git push origin main' when ready to deploy."
fi

echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "  - Production Readiness Report: PRODUCTION_READINESS.md"
echo "  - Enhanced Server Code: server/index-enhanced.js"
echo "  - Enhanced Vercel Config: vercel-enhanced.json"
echo ""
