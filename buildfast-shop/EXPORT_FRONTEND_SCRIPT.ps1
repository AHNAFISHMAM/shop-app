# ═══════════════════════════════════════════════════════════════════════
# 📦 EXPORT FRONTEND - PowerShell Script
# ═══════════════════════════════════════════════════════════════════════
# This script copies all frontend files to a new folder
# Run this from inside the buildfast-shop folder
# ═══════════════════════════════════════════════════════════════════════

Write-Host "`n╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                        ║" -ForegroundColor Cyan
Write-Host "║                  📦 EXPORTING FRONTEND FILES... 📦                     ║" -ForegroundColor Cyan
Write-Host "║                                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set export folder name
$exportFolder = "../shop-frontend-export"

# Create export folder
Write-Host "📁 Creating export folder..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $exportFolder -Force | Out-Null

# Copy src folder
Write-Host "📂 Copying src/ folder..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "$exportFolder/src" -Recurse -Force

# Copy configuration files
Write-Host "⚙️  Copying configuration files..." -ForegroundColor Yellow
Copy-Item -Path "package.json" -Destination "$exportFolder/" -Force
Copy-Item -Path "package-lock.json" -Destination "$exportFolder/" -Force
Copy-Item -Path "vite.config.js" -Destination "$exportFolder/" -Force
Copy-Item -Path "tailwind.config.js" -Destination "$exportFolder/" -Force
Copy-Item -Path "postcss.config.js" -Destination "$exportFolder/" -Force
Copy-Item -Path "eslint.config.js" -Destination "$exportFolder/" -Force
Copy-Item -Path "index.html" -Destination "$exportFolder/" -Force

# Create .env.example template
Write-Host "📝 Creating .env.example template..." -ForegroundColor Yellow
$envTemplate = @"
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Loops.so (Optional - for emails)
VITE_LOOPS_API_KEY=your_loops_key_here
"@
$envTemplate | Out-File -FilePath "$exportFolder/.env.example" -Encoding UTF8

# Create README
Write-Host "📄 Creating setup README..." -ForegroundColor Yellow
$readmeContent = @"
# Shop Frontend - Setup Instructions

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create \`.env\` file:
   - Copy \`.env.example\` to \`.env\`
   - Add your Supabase URL and anon key
   - Add your Stripe publishable key

3. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open browser:
   - http://localhost:5173

## What's Included

- ✅ Complete React frontend
- ✅ All UI components
- ✅ Customer & admin pages
- ✅ Real-time features
- ✅ Stripe checkout
- ✅ Responsive design

## Requirements

- Node.js 18+
- Supabase project
- Stripe account

## Documentation

See \`HOW_TO_COPY_FRONTEND.md\` for complete guide.
"@
$readmeContent | Out-File -FilePath "$exportFolder/README.md" -Encoding UTF8

# Success message
Write-Host "`n╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                        ║" -ForegroundColor Green
Write-Host "║                        ✅ EXPORT COMPLETE! ✅                           ║" -ForegroundColor Green
Write-Host "║                                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📦 EXPORTED FILES:`n" -ForegroundColor Cyan
Write-Host "  ✅ src/ folder (all components & pages)" -ForegroundColor Green
Write-Host "  ✅ package.json (dependencies)" -ForegroundColor Green
Write-Host "  ✅ vite.config.js (build config)" -ForegroundColor Green
Write-Host "  ✅ tailwind.config.js (styling)" -ForegroundColor Green
Write-Host "  ✅ All config files" -ForegroundColor Green
Write-Host "  ✅ .env.example (template)" -ForegroundColor Green
Write-Host "  ✅ README.md (setup guide)`n" -ForegroundColor Green

Write-Host "📁 LOCATION: $exportFolder`n" -ForegroundColor Yellow

Write-Host "🎯 NEXT STEPS:`n" -ForegroundColor Cyan
Write-Host "  1. cd $exportFolder" -ForegroundColor White
Write-Host "  2. Copy .env.example to .env" -ForegroundColor White
Write-Host "  3. Add your Supabase and Stripe keys to .env" -ForegroundColor White
Write-Host "  4. npm install" -ForegroundColor White
Write-Host "  5. npm run dev`n" -ForegroundColor White

Write-Host "════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "🎉 YOUR FRONTEND IS READY TO COPY/SHARE/DEPLOY! 🎉`n" -ForegroundColor Green

