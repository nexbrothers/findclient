#!/bin/bash

# ============================================
# Find Client — Deploy to Render.com (FREE)
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "=========================================="
echo "   Find Client — Deploy to Render.com"
echo "=========================================="
echo -e "${NC}"

# Step 1: Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}[1/5] Initializing git repository...${NC}"
    git init
    git branch -M main
else
    echo -e "${GREEN}[1/5] Git already initialized${NC}"
fi

# Step 2: Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) not found. Installing...${NC}"

    if command -v apt &> /dev/null; then
        # Ubuntu/Debian
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update && sudo apt install gh -y
    elif command -v brew &> /dev/null; then
        brew install gh
    else
        echo -e "${RED}Please install GitHub CLI manually: https://cli.github.com/${NC}"
        exit 1
    fi
fi

# Step 3: Login to GitHub if not already
if ! gh auth status &> /dev/null 2>&1; then
    echo -e "${YELLOW}[2/5] Logging into GitHub...${NC}"
    gh auth login
else
    echo -e "${GREEN}[2/5] Already logged into GitHub${NC}"
fi

# Step 4: Create GitHub repo and push
REPO_NAME="find-client"

echo -e "${YELLOW}[3/5] Creating GitHub repository & pushing code...${NC}"

# Add all files and commit
git add -A
git commit -m "Initial deploy: Find Client lead generation dashboard" 2>/dev/null || echo "Nothing new to commit"

# Check if remote exists
if git remote get-url origin &> /dev/null 2>&1; then
    echo -e "${GREEN}Remote 'origin' already exists. Pushing...${NC}"
    git push -u origin main
else
    # Create repo on GitHub
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
fi

GITHUB_URL=$(gh repo view --json url -q .url 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}=========================================="
echo -e "   Code pushed to GitHub!"
echo -e "==========================================${NC}"
echo ""

# Step 5: Deploy to Render
echo -e "${CYAN}=========================================="
echo -e "   Now deploy to Render.com (FREE)"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Follow these steps:${NC}"
echo ""
echo "  1. Go to: https://render.com"
echo "  2. Sign up with GitHub (free)"
echo "  3. Click '+ New' → 'Web Service'"
echo "  4. Connect your repo: ${GREEN}${GITHUB_URL:-$REPO_NAME}${NC}"
echo "  5. Settings will auto-fill from render.yaml:"
echo "     - Build Command: npm install"
echo "     - Start Command: node server.js"
echo "     - Plan: Free"
echo ""
echo "  6. Add these Environment Variables:"
echo "     ┌──────────────────────────┬─────────────────────────┐"
echo "     │ Key                      │ Value                   │"
echo "     ├──────────────────────────┼─────────────────────────┤"
echo "     │ GOOGLE_PLACES_API_KEY    │ your-google-api-key     │"
echo "     │ EMAIL_USER               │ your-email@gmail.com    │"
echo "     │ EMAIL_PASS               │ your-gmail-app-password │"
echo "     │ EMAIL_FROM_NAME          │ NexBrothers              │"
echo "     └──────────────────────────┴─────────────────────────┘"
echo ""
echo "  7. Click 'Create Web Service'"
echo ""
echo -e "${GREEN}Your app will be live at: https://find-client.onrender.com${NC}"
echo ""
echo -e "${CYAN}── Quick Update Deploy ──${NC}"
echo "  After making changes, just run:"
echo "    git add -A && git commit -m 'update' && git push"
echo "  Render auto-deploys on push!"
echo ""
