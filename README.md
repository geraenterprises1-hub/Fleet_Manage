# Uber Fleet Driver Management System

A full-stack web application for managing Uber fleet drivers and their daily car expenses. Built with Next.js 14, TypeScript, TailwindCSS, and Supabase.

## Features

### Admin Panel
- Login as admin
- Add/remove drivers
- View all drivers with statistics (total spent, last expense date)
- View and filter expenses across all drivers
- Export filtered expenses to CSV
- View analytics charts (expenses over time, by category)

### Driver Panel
- Login as driver
- Select date and add expense entries
- Expense categories: fuel, maintenance, toll, other
- Optional receipt image upload
- View paginated expense history
- Filter expenses by date range
- Mobile-first responsive UI

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for receipt images)
- **Authentication**: JWT-based with bcrypt password hashing
- **Charts**: Recharts

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Git

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd "Fleet manage"
npm install
```

### 2. Set Up Supabase

Your Supabase project is already configured:
- **Project URL**: `https://jwmcaffmulfzokzpabcl.supabase.co`
- **Database**: `db.jwmcaffmulfzokzpabcl.supabase.co:5432`

Follow these steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** and run the schema from `database/schema.sql`
4. Go to **Storage** and create a new bucket named `receipts` (make it public)
   - Or run: `node scripts/setup-storage.js`
5. Go to **Settings** > **API** and copy:
   - Project URL: `https://jwmcaffmulfzokzpabcl.supabase.co`
   - `anon` public key
   - `service_role` secret key

**See `SUPABASE_SETUP.md` for detailed setup instructions.**

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials (get API keys from Supabase Dashboard > Settings > API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://jwmcaffmulfzokzpabcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

DATABASE_URL=postgresql://postgres:Adarsh1234@db.jwmcaffmulfzokzpabcl.supabase.co:5432/postgres

JWT_SECRET=your_jwt_secret_key_here_min_32_chars

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ADMIN_EMAIL=admin@fleet.com

HIGH_VALUE_THRESHOLD=500
```

### 4. Seed the Database

Run the seed script to create initial users and sample data:

```bash
node scripts/seed-database.js
```

This will create:
- Admin user: `admin@fleet.com` / `password123`
- Driver 1: `driver1@fleet.com` / `password123`
- Driver 2: `driver2@fleet.com` / `password123`
- Sample expense entries

**Note**: Change these passwords in production!

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── expenses/     # Expense CRUD endpoints
│   │   ├── drivers/       # Driver management endpoints
│   │   └── analytics/     # Analytics endpoints
│   ├── admin/             # Admin dashboard page
│   ├── driver/            # Driver dashboard page
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ExpenseForm.tsx
│   ├── ExpenseTable.tsx
│   ├── Pagination.tsx
│   └── AnalyticsCharts.tsx
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database client
│   ├── middleware.ts     # API middleware
│   ├── storage.ts        # File upload utilities
│   ├── email.ts          # Email notifications
│   └── csv.ts            # CSV export utilities
├── types/                 # TypeScript type definitions
├── database/              # Database schema and seeds
│   ├── schema.sql
│   └── seed.sql
└── scripts/               # Utility scripts
    ├── generate-password-hash.js
    └── seed-database.js
```

## API Documentation

### Authentication

#### POST `/api/auth/login`
Login and get JWT token.

**Request:**
```json
{
  "email": "driver1@fleet.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "driver1@fleet.com",
    "name": "John Driver",
    "role": "driver"
  },
  "token": "jwt_token"
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "driver1@fleet.com",
    "name": "John Driver",
    "role": "driver"
  }
}
```

### Expenses

#### GET `/api/expenses`
List expenses with optional filters.

**Query Parameters:**
- `driver_id` (optional): Filter by driver ID
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)
- `category` (optional): Filter by category (fuel/maintenance/toll/other)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

#### POST `/api/expenses`
Create a new expense.

**Headers:**
```
Authorization: Bearer <token>
```

**Body (FormData):**
- `date`: Date (YYYY-MM-DD)
- `category`: fuel/maintenance/toll/other
- `amount`: Number
- `note` (optional): String
- `receipt` (optional): File

#### GET `/api/expenses/[id]`
Get a single expense by ID.

#### PUT `/api/expenses/[id]`
Update an expense.

#### DELETE `/api/expenses/[id]`
Delete an expense.

#### GET `/api/expenses/export`
Export expenses to CSV (Admin only).

**Query Parameters:** Same as GET `/api/expenses`

### Drivers

#### GET `/api/drivers`
List all drivers with statistics (Admin only).

**Response:**
```json
{
  "data": [
    {
      "driver_id": "uuid",
      "driver_name": "John Driver",
      "driver_email": "driver1@fleet.com",
      "total_spent": 500.50,
      "last_expense_date": "2024-01-15",
      "expense_count": 10
    }
  ]
}
```

#### POST `/api/drivers`
Create a new driver (Admin only).

**Request:**
```json
{
  "name": "New Driver",
  "email": "newdriver@fleet.com",
  "password": "password123"
}
```

#### DELETE `/api/drivers/[id]`
Delete a driver (Admin only).

### Analytics

#### GET `/api/analytics`
Get analytics data for charts (Admin only).

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)

**Response:**
```json
{
  "byCategory": [
    { "name": "fuel", "value": 500.50 },
    { "name": "maintenance", "value": 350.00 }
  ],
  "byDate": [
    { "date": "2024-01-15", "amount": 45.50 }
  ],
  "total": 850.50
}
```

## Security Features

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Server-side authorization checks
- Row-level security (RLS) in database
- Input validation on all endpoints

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase Setup for Production

1. Update CORS settings in Supabase dashboard
2. Configure email templates (if using email notifications)
3. Set up proper backup strategy
4. Review and tighten RLS policies

## Testing

Basic API tests are included. Run with:

```bash
npm test
```

(Note: Test files need to be created - see `__tests__` directory)

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check if Supabase project is active
- Ensure schema.sql has been run

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration (default: 7 days)
- Clear browser localStorage if needed

### Image Upload Issues
- Ensure `receipts` bucket exists in Supabase Storage
- Check bucket is set to public
- Verify file size limits

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

