#!/bin/bash
# LoanFi Deployment Script
# Run this to deploy to Vercel

echo "🚀 LoanFi Deployment Script"
echo "=========================="
echo ""

# Check if logged in
echo "Checking Vercel login status..."
vercel whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Vercel"
    echo ""
    echo "Please login first:"
    echo "  vercel login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Navigate to project
cd /root/clawd/loanfi

# Deploy
echo "🚀 Deploying to Vercel..."
echo ""
vercel --prod

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Check deployment status in Vercel dashboard"
echo "2. Add environment variables in Project Settings"
echo "3. Run database migrations"
echo "4. Test the deployment"
