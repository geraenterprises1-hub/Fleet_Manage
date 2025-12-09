# Supabase Setup Guide

This guide will help you set up Supabase for the Fleet Management System.

## Your Supabase Connection Details

Based on your connection URI:
- **Project URL**: `https://jwmcaffmulfzokzpabcl.supabase.co`
- **Database Host**: `db.jwmcaffmulfzokzpabcl.supabase.co`
- **Database Port**: `5432`
- **Database Name**: `postgres`
- **Database User**: `postgres`

## Step 1: Get Your API Keys

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following:
   - **Project URL**: `https://jwmcaffmulfzokzpabcl.supabase.co`
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - keep this secret!)

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jwmcaffmulfzokzpabcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Connection (optional, for direct Postgres access)
DATABASE_URL=postgresql://postgres:Adarsh1234@db.jwmcaffmulfzokzpabcl.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here_min_32_chars

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ADMIN_EMAIL=admin@fleet.com

# High-value expense threshold
HIGH_VALUE_THRESHOLD=500
```

## Step 3: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `database/schema.sql`
3. Click **Run** to execute the SQL

This will create:
- `profiles` table (for users)
- `expenses` table (for expense records)
- Indexes for performance
- Row Level Security (RLS) policies

## Step 4: Set Up Storage Bucket for Receipts

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it: `receipts`
4. Make it **Public** (so images can be accessed via URL)
5. Click **Create bucket**

### Storage Policies (Optional but Recommended)

Go to **Storage** > **Policies** for the `receipts` bucket and add:

**Policy: Allow public read access**
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');
```

**Policy: Allow authenticated uploads**
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);
```

**Policy: Users can delete their own files**
```sql
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);
```

## Step 5: Seed the Database

Run the seed script to create initial users and sample data:

```bash
node scripts/seed-database.js
```

This creates:
- Admin: `admin@fleet.com` / `password123`
- Driver 1: `driver1@fleet.com` / `password123`
- Driver 2: `driver2@fleet.com` / `password123`
- Sample expense entries

## Step 6: Verify Setup

1. Check that tables exist: Go to **Table Editor** in Supabase dashboard
2. Check that storage bucket exists: Go to **Storage** in Supabase dashboard
3. Test the connection by running: `npm run dev`

## Troubleshooting

### Connection Issues
- Verify your API keys are correct in `.env.local`
- Check that your Supabase project is active (not paused)
- Ensure you're using the correct project URL

### Storage Issues
- Verify the `receipts` bucket exists and is public
- Check storage policies if uploads fail
- Ensure file size limits are appropriate (default is 50MB)

### Database Issues
- Verify schema.sql was run successfully
- Check RLS policies if queries fail
- Review Supabase logs in the dashboard

## Security Notes

- **Never commit** `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (it bypasses RLS)
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- Regularly rotate your database password
- Enable 2FA on your Supabase account

