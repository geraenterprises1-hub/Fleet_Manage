# How to Change Admin Email and Password

There are multiple ways to change the admin email and password:

## Method 1: Using the Script (Recommended)

Run the interactive script:

```bash
npm run update:admin
```

Or directly:

```bash
node scripts/update-admin.js
```

The script will:
1. Ask for the current admin email
2. Ask if you want to update email
3. Ask if you want to update password
4. Update the credentials in the database

## Method 2: Manual Update via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** → **profiles**
4. Find the admin user (role = 'admin')
5. Click on the row to edit
6. Update the `email` field
7. For password, you need to update the `password_hash` field:
   - Generate a new hash using: `node -e "const bcrypt=require('bcryptjs');bcrypt.hash('your_new_password',10).then(h=>console.log(h))"`
   - Copy the hash and paste it into the `password_hash` field
8. Click **Save**

## Method 3: Using SQL Query in Supabase SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query (replace values):

```sql
-- Update email only
UPDATE profiles 
SET email = 'newadmin@fleet.com' 
WHERE role = 'admin' AND email = 'admin@fleet.com';

-- Update password (you need to generate hash first)
-- Generate hash using Node.js:
-- node -e "const bcrypt=require('bcryptjs');bcrypt.hash('newpassword123',10).then(h=>console.log(h))"
UPDATE profiles 
SET password_hash = 'generated_hash_here' 
WHERE role = 'admin' AND email = 'admin@fleet.com';

-- Update both email and password
UPDATE profiles 
SET 
  email = 'newadmin@fleet.com',
  password_hash = 'generated_hash_here'
WHERE role = 'admin' AND email = 'admin@fleet.com';
```

## Method 4: Create a New Admin User

If you want to create a completely new admin user:

```bash
node scripts/create-admin.js
```

Then manually update the email in the script or database.

## Security Notes

- ⚠️ Always use strong passwords (minimum 8 characters, mix of letters, numbers, symbols)
- ⚠️ Never commit `.env.local` file to git
- ⚠️ Change default passwords in production
- ⚠️ Keep admin credentials secure

## Current Default Credentials

- **Email**: `admin@fleet.com`
- **Password**: `password123`

**⚠️ Change these in production!**

