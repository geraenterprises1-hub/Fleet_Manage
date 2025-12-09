# Vercel Deployment Guide

## Environment Variables Required

**⚠️ CRITICAL: Set these in Vercel Dashboard → Your Project → Settings → Environment Variables**

### Required Variables (Set for Production, Preview, and Development)

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`
   - Found in: Supabase Dashboard → Project Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ Server-side only
   - Your Supabase service role key (keep secret!)
   - Found in: Supabase Dashboard → Project Settings → API → Project API keys → `service_role` `secret`
   - **Important**: Never expose this in client-side code

4. **NEXT_PUBLIC_JWT_SECRET**
   - A random secret string for JWT token signing
   - Generate a strong random string (at least 32 characters)
   - Example: `your-super-secret-jwt-key-change-this-in-production-12345`

5. **NEXT_PUBLIC_APP_URL** (Optional but Recommended)
   - Your Vercel deployment URL
   - **For Production**: Use your custom domain or Vercel-provided URL
   - Example: `https://your-project-name.vercel.app` or `https://yourdomain.com`
   - **Note**: Vercel automatically provides `VERCEL_URL`, but setting this explicitly ensures consistency
   - **After first deployment**: Vercel will show your deployment URL, use that value

## Deployment Steps

1. **Import Project** (Already Done ✅)
   - Project imported from GitHub: https://github.com/geraenterprises1-hub/Fleet_Manage

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables listed above
   - Make sure to set them for Production, Preview, and Development environments

3. **Build Settings**
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Deploy**
   - Click "Deploy" button
   - Vercel will automatically build and deploy

## Important Notes

- ✅ Environment variables are already in `.gitignore` (`.env*.local`, `.env`)
- ✅ Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (server-side only)
- ✅ `NEXT_PUBLIC_*` variables are exposed to the browser
- ✅ Database migrations need to be run manually in Supabase SQL Editor

## Post-Deployment

1. Run database migrations in Supabase:
   - `database/preserve-driver-data.sql`
   - `database/add-vehicle-number-to-expenses.sql`
   - `database/update-existing-driver-names.sql`

2. Create storage bucket in Supabase:
   - Bucket name: `receipts`
   - Public: Yes

3. Test the deployment:
   - Admin login: `/fleet/admin/login`
   - Driver login: `/fleet/driver/login`

## Troubleshooting

- If build fails, check Vercel build logs
- Ensure all environment variables are set
- Verify Supabase connection strings are correct
- Check that database tables exist in Supabase

