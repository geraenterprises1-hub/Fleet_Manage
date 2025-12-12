# Database Migration: Allow NULL driver_id

## Problem
The `expenses` table has a NOT NULL constraint on `driver_id`, but admin expenses need to allow NULL values (for expenses not associated with a specific driver).

## Solution
Run the migration SQL file to remove the NOT NULL constraint.

## How to Run

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the entire contents of `database/allow-null-driver-id.sql`
6. Click **Run** (or press Ctrl/Cmd + Enter)

### Option 2: Using psql (if you have PostgreSQL client installed)
```bash
psql "your_database_url" -f database/allow-null-driver-id.sql
```

Replace `your_database_url` with your DATABASE_URL from `.env.local`

### Option 3: Using Node.js script (may not work for DDL)
```bash
node scripts/allow-null-driver-id.js
```

**Note**: Option 1 (Supabase SQL Editor) is the most reliable method.

## What This Migration Does
1. Removes the NOT NULL constraint from `driver_id` column
2. Updates the foreign key constraint to allow NULL values
3. Updates the trigger function to handle NULL `driver_id` properly

## Verification
After running the migration, you can verify it worked by running this query in Supabase SQL Editor:

```sql
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_name = 'expenses' 
  AND column_name = 'driver_id';
```

The `is_nullable` column should show `YES`.

