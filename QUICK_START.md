# Quick Start Guide

## Your Supabase Project

- **Project URL**: `https://jwmcaffmulfzokzpabcl.supabase.co`
- **Database**: `db.jwmcaffmulfzokzpabcl.supabase.co:5432`

## Setup Steps (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Keys from Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL** (already have: `https://jwmcaffmulfzokzpabcl.supabase.co`)
   - **anon public** key
   - **service_role** key (keep secret!)

### 3. Create `.env.local` File

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your API keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jwmcaffmulfzokzpabcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here

DATABASE_URL=postgresql://postgres:Adarsh1234@db.jwmcaffmulfzokzpabcl.supabase.co:5432/postgres

JWT_SECRET=generate_a_random_32_character_string_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
HIGH_VALUE_THRESHOLD=500
```

### 4. Set Up Database Schema

1. Go to Supabase Dashboard > **SQL Editor**
2. Copy contents of `database/schema.sql`
3. Paste and click **Run**

### 5. Set Up Storage Bucket

**Option A: Using Script (Recommended)**
```bash
npm run setup:storage
```

**Option B: Manual**
1. Go to Supabase Dashboard > **Storage**
2. Click **New bucket**
3. Name: `receipts`
4. Make it **Public**
5. Click **Create**

### 6. Seed Database (Optional)

Create initial users and sample data:
```bash
npm run setup:seed
```

This creates:
- Admin: `admin@fleet.com` / `password123`
- Driver 1: `driver1@fleet.com` / `password123`
- Driver 2: `driver2@fleet.com` / `password123`

### 7. Verify Setup

```bash
npm run setup:verify
```

### 8. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Test Login

- **Admin**: `admin@fleet.com` / `password123`
- **Driver**: `driver1@fleet.com` / `password123`

## Troubleshooting

### "Bucket not found" error
Run: `npm run setup:storage`

### "Table not found" error
Run the SQL from `database/schema.sql` in Supabase SQL Editor

### "Unauthorized" error
Check your API keys in `.env.local`

### Need help?
See `SUPABASE_SETUP.md` for detailed instructions.

