#!/bin/bash

# Build Static Export Script for cPanel
# This script builds a static version of the Next.js app

echo "🚀 Building Static Export for cPanel..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || exit

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Creating .env.local template..."
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=https://stockmartlic.com/api
EOF
    echo "✅ Created .env.local - Please edit it with your Supabase credentials!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build static export
echo "🔨 Building static export..."
npm run build

# Check if build was successful
if [ ! -d "out" ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

# Create zip file
echo "📦 Creating zip file..."
cd out || exit
zip -r ../static-frontend.zip . -q
cd ..

# Copy .htaccess to out folder
cp .htaccess out/.htaccess 2>/dev/null || echo "⚠️  .htaccess not found in frontend directory"

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Files ready for upload:"
echo "   - static-frontend.zip (upload and extract this)"
echo "   - out/.htaccess (make sure this is included)"
echo ""
echo "📤 Upload Instructions:"
echo "   1. Upload static-frontend.zip to cPanel"
echo "   2. Extract in public_html (or your domain directory)"
echo "   3. Make sure .htaccess is in the root"
echo "   4. Done! No Node.js needed!"
echo ""


