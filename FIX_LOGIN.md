# 🔧 Fix Login Issue

The login error occurs because **database tables don't exist yet**. Here's how to fix it:

## Quick Fix (2 minutes)

### Step 1: Create Database Tables

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Click "SQL Editor"** (left sidebar)
4. **Click "New query"** button
5. **Open** the file: `database/schema.sql` in this project
6. **Copy ALL contents** of `database/schema.sql`
7. **Paste** into the SQL Editor
8. **Click "Run"** (or press Cmd/Ctrl + Enter)

Wait for it to complete (should show "Success" message).

### Step 2: Create Users

After tables are created, run:

```bash
npm run fix:users
```

Or manually:

```bash
node scripts/force-create-users.js
```

This will create:
- Admin: `admin@fleet.com` / `password123`
- Driver 1: `driver1@fleet.com` / `password123`
- Driver 2: `driver2@fleet.com` / `password123`

### Step 3: Test Login

Go to http://localhost:3000 and try logging in with:
- Email: `admin@fleet.com`
- Password: `password123`

## Alternative: Run Everything Automatically

If you have your Supabase API keys configured in `.env.local`, run:

```bash
npm run setup:all
```

This will:
1. Try to create tables automatically
2. Create users
3. Verify everything works

## Troubleshooting

### "Table not found" error
- Make sure you ran `database/schema.sql` in Supabase SQL Editor
- Wait 10-30 seconds after running SQL for schema cache to refresh

### "Invalid email or password"
- Make sure users were created: Run `node scripts/force-create-users.js`
- Check that password hash is correct

### "Unauthorized" error
- Add your Supabase API keys to `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Get them from: Supabase Dashboard > Settings > API

## Still Having Issues?

1. Check Supabase project is active (not paused)
2. Verify API keys are correct in `.env.local`
3. Check browser console for detailed error messages
4. Check server logs in terminal

