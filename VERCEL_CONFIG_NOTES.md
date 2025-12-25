# Vercel Configuration Notes

## Issue Fixed
**Error:** `No Output Directory named "dist" found after the Build completed`

## Solution
Moved `vercel.json` from `buildfast-shop/` to repository **root** and configured correctly.

## Configuration Details

### vercel.json Location
- ✅ **Root directory** (`/vercel.json`) - NOT in `buildfast-shop/`
- Vercel reads `vercel.json` from the repository root

### Build Command
```json
"buildCommand": "npm run build"
```
- Uses root `package.json` build script
- Which runs: `cd buildfast-shop && npm install && npm run build`
- Creates `buildfast-shop/dist/` directory

### Output Directory
```json
"outputDirectory": "buildfast-shop/dist"
```
- Path is **relative to repository root**
- NOT relative to where build command runs
- Vercel looks for this path after build completes

## Vercel Project Settings (Optional Override)

If you need to override in Vercel Dashboard:
1. Go to **Settings** → **General** → **Build & Development Settings**
2. **Root Directory:** Leave empty (uses repository root)
3. **Build Command:** `npm run build` (or leave empty to use vercel.json)
4. **Output Directory:** `buildfast-shop/dist` (or leave empty to use vercel.json)

## Verification

After deployment, verify:
1. ✅ Build completes successfully
2. ✅ `buildfast-shop/dist` directory is found
3. ✅ App deploys without "No Output Directory" error
4. ✅ All routes work (SPA routing via rewrites)

## Troubleshooting

If still seeing errors:
1. Check build logs - verify `dist` folder is created
2. Verify `vercel.json` is in repository root (not subdirectory)
3. Check outputDirectory path matches actual build output location
4. Ensure build command completes successfully before Vercel looks for output

