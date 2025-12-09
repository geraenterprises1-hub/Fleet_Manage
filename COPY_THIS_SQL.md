# 📋 COPY THIS SQL TO FIX LOGIN

## Quick Steps:

1. **Open**: https://supabase.com/dashboard
2. **Click**: Your project
3. **Click**: "SQL Editor" (left sidebar)
4. **Click**: "New query"
5. **Copy ALL the SQL below** (from START to END)
6. **Paste** into SQL Editor
7. **Click**: "Run" button (or press Cmd/Ctrl + Enter)

---

## START COPYING FROM HERE ↓

```sql
-- Uber Fleet Driver Management System Database Schema
-- Run this in your Supabase SQL Editor or Postgres database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (users: admin and drivers)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'driver')),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('fuel', 'maintenance', 'toll', 'other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_driver_id ON expenses(driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Drivers can only read their own expenses
CREATE POLICY "Drivers can read own expenses" ON expenses
  FOR SELECT USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Drivers can insert their own expenses
CREATE POLICY "Drivers can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- Policy: Drivers can update their own expenses
CREATE POLICY "Drivers can update own expenses" ON expenses
  FOR UPDATE USING (driver_id = auth.uid());

-- Policy: Drivers can delete their own expenses
CREATE POLICY "Drivers can delete own expenses" ON expenses
  FOR DELETE USING (driver_id = auth.uid());
```

## END COPYING HERE ↑

---

## After Running SQL:

1. **Wait 10-30 seconds** for schema cache to refresh
2. **Run this command**:
   ```bash
   npm run fix:users
   ```
3. **Go to**: http://localhost:3000
4. **Login with**: `admin@fleet.com` / `password123`

---

**That's it!** Your login will work after this.

