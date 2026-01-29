# Vercel Deployment Guide

## Current Status

✅ **Local Build**: Passes successfully  
⚠️ **Vercel Deployments**: Recent deployments failing

## Build Issues Identified

### 1. Missing Environment Variables (CRITICAL)

The application requires these environment variables to build:

```env
# Admin Authentication (Required)
ADMIN_AUTH_ENABLED=true
ADMIN_JWT_SECRET=<your-32-char-secret>
ADMIN_USERS=<admin:bcrypt-hash>

# Data Store Configuration
SIGHTSIGNAL_DATA_STORE=file
SIGHTSIGNAL_DATA_DIR=.local

# Optional PostgreSQL (if using postgres store)
# SIGHTSIGNAL_DATABASE_URL=postgresql://...
```

### 2. Missing npm Script (FIXED)

**Issue**: CI workflow expected `npm run test:coverage` which was missing.  
**Fix**: Added `"test:coverage": "vitest run --coverage"` to package.json

## How to Fix Vercel Deployments

### Step 1: Configure Environment Variables in Vercel

1. Go to https://vercel.com/jerrettdavis-projects/sight-signal/settings/environment-variables

2. Add the following environment variables for **All Environments** (Production, Preview, Development):

   ```
   ADMIN_AUTH_ENABLED = true
   ADMIN_JWT_SECRET = <generate with: openssl rand -base64 32>
   ADMIN_USERS = <generate with: node scripts/generate-admin-hash.mjs YourPassword>
   SIGHTSIGNAL_DATA_STORE = file
   SIGHTSIGNAL_DATA_DIR = .local
   ```

3. **Important**: For `ADMIN_USERS`, the format is:
   ```
   username:$2b$10$hashedPasswordHere
   ```
   
   Generate the hash locally:
   ```bash
   node scripts/generate-admin-hash.mjs YourSecurePassword
   ```

### Step 2: Redeploy

After adding environment variables:

1. Go to Deployments tab
2. Click on a failed deployment
3. Click "Redeploy" button

OR trigger a new deployment:
```bash
git commit --allow-empty -m "chore: trigger Vercel rebuild"
git push origin main
```

## Recent Failed Deployments Analysis

Recent failures (7-10 minutes ago) were likely from:
- Dependabot PR branches that don't inherit environment variables
- Missing `ADMIN_JWT_SECRET` and `ADMIN_USERS` in Vercel project settings

## Successful Deployment Checklist

- [ ] All required environment variables added to Vercel
- [ ] Environment variables set for Production AND Preview environments
- [ ] `test:coverage` script added to package.json
- [ ] Build passes locally (`npm run build`)
- [ ] Redeploy triggered after env var changes

## Verifying Build Success

After deployment completes:

1. Check build logs in Vercel dashboard
2. Should see "Compiled successfully" message
3. Should see route list with all API endpoints
4. Deployment status should be "Ready" (not "Error")

## Common Errors

### Error: "Build failed"
- **Cause**: Missing environment variables
- **Fix**: Add all required vars in Vercel settings

### Error: "npm run test:coverage not found"
- **Cause**: Missing script in package.json
- **Fix**: Already fixed in this commit

### Error: Authentication required
- **Cause**: Deployment protection enabled for preview branches
- **Fix**: This is normal for preview deployments, not an error

## Next Steps

1. Configure environment variables in Vercel (critical)
2. Commit the test:coverage script fix
3. Push to trigger new deployment
4. Verify build succeeds
