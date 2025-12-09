# ⚡ Quick Fix for Login Error

## The Problem
You're seeing: `POST http://localhost:3000/api/auth/login 401 (Unauthorized)`

**Reason**: Database tables don't exist yet.

## The Solution (Copy-Paste Ready)

### 1. Create Tables (Required - 2 minutes)

**Go to**: https://supabase.com/dashboard

1. Click your project
2. Click **SQL Editor** (left sidebar)  
3. Click **New query**
4. Copy this entire file: `database/schema.sql`
5. Paste into SQL Editor
6. Click **Run** ✅

### 2. Create Users (After tables exist)

Run this command:

```bash
npm run fix:users
```

### 3. Login

Go to: http://localhost:3000

- **Email**: `admin@fleet.com`
- **Password**: `password123`

---

## One-Line Fix (if you have API keys)

```bash
npm run setup:all && npm run fix:users
```

---

**That's it!** The login should work after creating the tables.

