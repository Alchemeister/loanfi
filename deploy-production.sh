#!/bin/bash
# Deploy LoanFi to Vercel with all environment variables

echo "🚀 LoanFi Deployment Script"
echo "=========================="
echo ""

# Check if logged in
echo "Step 1: Checking Vercel login..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Please login first: vercel login"
    exit 1
fi
echo "✅ Logged in"
echo ""

# Link project
echo "Step 2: Linking to Vercel project..."
vercel link --project defi-loan-aggregator --yes
echo ""

# Set environment variables
echo "Step 3: Setting environment variables..."

echo "  Setting ALCHEMY_API_KEY..."
echo "ZaLq87qZJdrsF9VSxCv0l" | vercel env add ALCHEMY_API_KEY production --yes

echo "  Setting NEXT_PUBLIC_WALLETCONNECT_ID..."
echo "15c33989180058138c4814b77f74581d" | vercel env add NEXT_PUBLIC_WALLETCONNECT_ID production --yes

echo "  Setting NEXT_PUBLIC_WIDGET_URL..."
echo "https://defi-loan-aggregator.vercel.app" | vercel env add NEXT_PUBLIC_WIDGET_URL production --yes

echo "  Setting NEXT_PUBLIC_APP_URL..."
echo "https://defi-loan-aggregator.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production --yes

echo "  Setting NEXT_PUBLIC_DEFAULT_CHAIN..."
echo "base" | vercel env add NEXT_PUBLIC_DEFAULT_CHAIN production --yes

echo "  Setting NEXT_PUBLIC_SUPPORTED_CHAINS..."
echo "base,arbitrum,ethereum,polygon,optimism" | vercel env add NEXT_PUBLIC_SUPPORTED_CHAINS production --yes

echo "  Setting AAVE_REFERRAL_CODE..."
echo "0" | vercel env add AAVE_REFERRAL_CODE production --yes

echo ""
echo "✅ Environment variables set!"
echo ""

# Deploy
echo "Step 4: Deploying to production..."
vercel --prod --yes

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard → Storage → Create Database (Vercel Postgres)"
echo "2. Run migrations: vercel --prod run npm run db:migrate"
echo "3. Seed database: vercel --prod run npm run db:seed"
