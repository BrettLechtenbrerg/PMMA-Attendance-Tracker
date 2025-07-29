# PMMA Attendance Tracker - Deployment Guide

## 🚀 Quick Netlify Deployment Guide

This document provides step-by-step instructions for deploying the PMMA Attendance Tracker to Netlify for team testing.

### Prerequisites

Before deploying, ensure you have:
- ✅ Netlify account (free tier works)
- ✅ Supabase project set up with database schema
- ✅ Environment variables ready
- ✅ PWA icons created (see note below)

### Step 1: Prepare Environment Variables

You'll need these environment variables for production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kvwijnsjdxjllfswuvwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Note**: The Supabase URL is already configured. You'll need to provide the keys from your Supabase dashboard.

### Step 2: Deploy to Netlify

#### Option A: Git-based Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - PMMA Attendance Tracker"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - **Build settings are auto-detected from netlify.toml**

3. **Configure Environment Variables**:
   - In Netlify dashboard, go to Site settings → Environment variables
   - Add the three environment variables listed above
   - **Important**: Use the exact variable names as shown

#### Option B: Manual Upload

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Drag & Drop**:
   - Zip the `.next` folder
   - Upload to Netlify's manual deploy interface

### Step 3: Configure Custom Domain (Optional)

- In Netlify dashboard: Site settings → Domain management
- Add custom domain if needed
- SSL certificates are automatically provisioned

### Step 4: Test Deployment

After deployment, test these key features:

#### Authentication Flow
- [ ] Login/logout functionality
- [ ] Role-based redirects (admin to dashboard, parent to portal)

#### QR Code Scanner
- [ ] Camera permissions work
- [ ] QR codes scan correctly
- [ ] Attendance records are created

#### PWA Installation
- [ ] Install prompt appears on mobile
- [ ] App works offline
- [ ] Service worker caches properly

#### Database Operations
- [ ] Student CRUD operations
- [ ] Attendance tracking
- [ ] Family management
- [ ] Reporting functions

### PWA Icons Setup

**⚠️ Action Required**: Replace placeholder icon files with actual images:

1. `public/icon-192x192.png` - 192x192 app icon
2. `public/icon-512x512.png` - 512x512 app icon  
3. `public/favicon.ico` - Website favicon

**Design Guidelines**:
- Use PMMA branding colors: Black (#000000), Gold (#FFD700), Cranberry (#DC143C)
- Include martial arts or QR code themed elements
- Ensure icons are clear at small sizes

### Environment-Specific Configuration

#### Development
```bash
npm run dev
# Runs on http://localhost:3000
```

#### Production Health Check
After deployment, test the health endpoint:
```
https://your-netlify-domain.netlify.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "authentication": "available", 
    "pwa": "enabled"
  }
}
```

### Troubleshooting

#### Common Issues

**Build Fails with ESLint Errors**
- ✅ **Fixed**: All unescaped entity errors have been resolved

**Environment Variables Not Working**
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces in values
- Restart deployment after changes

**QR Scanner Not Working**
- Ensure HTTPS is enabled (automatic on Netlify)
- Check browser camera permissions
- Test on multiple devices/browsers

**PWA Not Installing**
- Replace placeholder icon files with actual images
- Verify manifest.json is accessible
- Check service worker registration in DevTools

#### Database Issues

**Connection Errors**
1. Verify Supabase URL and keys in Netlify environment variables
2. Check RLS policies are properly configured
3. Test database connection via health endpoint

**Migration Issues**
1. Run migrations in Supabase SQL editor:
   ```sql
   -- Copy contents of supabase/migrations/001_initial_schema.sql
   -- and execute in Supabase dashboard
   ```

### Security Notes

#### Production Checklist
- [ ] Environment variables set in Netlify (not in code)
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced (automatic on Netlify)
- [ ] Security headers configured (in netlify.toml)

#### User Roles for Testing

Create test accounts with different roles:

**Owner Account**
- Full system access
- User management capabilities
- All features unlocked

**Manager Account** 
- Student/family management
- Reporting access
- No user management

**Instructor Account**
- Attendance scanning
- Basic student lookup
- Limited reporting

**Parent Account**
- Portal access only
- View own children's data
- Read-only permissions

### Team Testing Guide

Share this information with your testing team:

#### Test App URL
```
https://your-netlify-domain.netlify.app
```

#### Test Scenarios

1. **Mobile Installation**
   - Install as PWA on phone
   - Test offline functionality
   - Verify scanner works

2. **Role-based Access**
   - Test each user role
   - Verify permission boundaries
   - Check data isolation

3. **Core Workflows**
   - Student registration
   - QR code scanning
   - Attendance reporting
   - Family management

#### Feedback Collection

For issues and feedback:
- Create issues in project repository
- Include browser/device information
- Provide step-by-step reproduction steps
- Include screenshots for UI issues

### Post-Deployment Monitoring

#### Analytics (Optional)
- Consider adding Google Analytics or similar
- Monitor usage patterns
- Track feature adoption

#### Performance
- Use Lighthouse for PWA scoring
- Monitor Core Web Vitals
- Test on various devices/connections

### Continuous Deployment

The project includes GitHub Actions for automated testing and deployment:
- Tests run on every push
- Automated deployment to staging
- Manual promotion to production

---

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review Netlify build logs
3. Test health endpoint
4. Check browser console for errors

**Ready to deploy!** 🚀

The PMMA Attendance Tracker is fully configured for Netlify deployment with:
- ✅ Build configuration (netlify.toml)
- ✅ Environment variables documented  
- ✅ PWA setup complete
- ✅ Security headers configured
- ✅ Health monitoring endpoint
- ✅ All ESLint errors fixed

Just add your environment variables and deploy!