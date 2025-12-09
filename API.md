# API Specification

Complete API documentation for the Fleet Management System.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via `/api/auth/login` and expire after 7 days.

## Endpoints

### Authentication

#### POST `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "admin" | "driver"
  },
  "token": "jwt_token_string"
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials

---

#### GET `/api/auth/me`

Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "admin" | "driver",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `401`: Unauthorized (no token or invalid token)
- `404`: User not found

---

### Expenses

#### GET `/api/expenses`

List expenses with pagination and filters.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `driver_id` | string (UUID) | No | Filter by driver ID (admin only) |
| `start_date` | string (YYYY-MM-DD) | No | Filter expenses from this date |
| `end_date` | string (YYYY-MM-DD) | No | Filter expenses to this date |
| `category` | string | No | Filter by category: `fuel`, `maintenance`, `toll`, `other` |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "driver_id": "uuid",
      "date": "YYYY-MM-DD",
      "category": "fuel" | "maintenance" | "toll" | "other",
      "amount": 45.50,
      "note": "string or null",
      "receipt_url": "string or null",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

**Authorization:**
- Drivers: Can only see their own expenses
- Admins: Can see all expenses, can filter by driver

---

#### POST `/api/expenses`

Create a new expense entry.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data` (for file upload)

**Request Body (FormData):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string (YYYY-MM-DD) | Yes | Expense date |
| `category` | string | Yes | `fuel`, `maintenance`, `toll`, or `other` |
| `amount` | number | Yes | Expense amount (must be > 0) |
| `note` | string | No | Optional note |
| `receipt` | File | No | Receipt image (JPEG, PNG) |
| `driver_id` | string (UUID) | No | Driver ID (admin only, defaults to current user) |

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "driver_id": "uuid",
    "date": "YYYY-MM-DD",
    "category": "fuel",
    "amount": 45.50,
    "note": "Gas station fill-up",
    "receipt_url": "https://...",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid amount
- `401`: Unauthorized
- `500`: Server error

**Notes:**
- High-value expenses (>= $500) trigger email notification to admin
- Receipt images are uploaded to Supabase Storage

---

#### GET `/api/expenses/[id]`

Get a single expense by ID.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "driver_id": "uuid",
    "date": "YYYY-MM-DD",
    "category": "fuel",
    "amount": 45.50,
    "note": "string or null",
    "receipt_url": "string or null",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (driver trying to access another driver's expense)
- `404`: Expense not found

---

#### PUT `/api/expenses/[id]`

Update an existing expense.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "date": "YYYY-MM-DD" (optional),
  "category": "fuel" | "maintenance" | "toll" | "other" (optional),
  "amount": 45.50 (optional),
  "note": "string" (optional),
  "receipt_url": "string" (optional)
}
```

**Response (200):**
```json
{
  "data": {
    // Updated expense object
  }
}
```

**Error Responses:**
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Expense not found

---

#### DELETE `/api/expenses/[id]`

Delete an expense.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (200):**
```json
{
  "message": "Expense deleted successfully"
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Expense not found

**Notes:**
- Also deletes associated receipt image from storage

---

#### GET `/api/expenses/export`

Export expenses to CSV (Admin only).

**Headers:**
- `Authorization: Bearer <token>` (required, admin role)

**Query Parameters:** Same as GET `/api/expenses` (except pagination)

**Response (200):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="expenses-{timestamp}.csv"`

**CSV Format:**
```csv
ID,Driver ID,Date,Category,Amount,Note,Receipt URL,Created At
uuid,uuid,2024-01-15,fuel,45.50,"Gas station",https://...,2024-01-15T10:00:00Z
```

---

### Drivers

#### GET `/api/drivers`

List all drivers with statistics (Admin only).

**Headers:**
- `Authorization: Bearer <token>` (required, admin role)

**Response (200):**
```json
{
  "data": [
    {
      "driver_id": "uuid",
      "driver_name": "John Driver",
      "driver_email": "driver1@fleet.com",
      "total_spent": 500.50,
      "last_expense_date": "2024-01-15" | null,
      "expense_count": 10
    }
  ]
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (not admin)

---

#### POST `/api/drivers`

Create a new driver account (Admin only).

**Headers:**
- `Authorization: Bearer <token>` (required, admin role)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 6 characters)"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "newdriver@fleet.com",
    "name": "New Driver",
    "role": "driver",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**
- `400`: Missing fields, invalid email, or email already exists
- `401`: Unauthorized
- `403`: Forbidden (not admin)
- `500`: Server error

---

#### DELETE `/api/drivers/[id]`

Delete/revoke a driver account (Admin only).

**Headers:**
- `Authorization: Bearer <token>` (required, admin role)

**Response (200):**
```json
{
  "message": "Driver deleted successfully"
}
```

**Error Responses:**
- `400`: Cannot delete non-driver user
- `401`: Unauthorized
- `403`: Forbidden (not admin)
- `404`: Driver not found

**Notes:**
- Cascades to delete all associated expenses

---

### Analytics

#### GET `/api/analytics`

Get analytics data for charts (Admin only).

**Headers:**
- `Authorization: Bearer <token>` (required, admin role)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | string (YYYY-MM-DD) | No | Filter from date |
| `end_date` | string (YYYY-MM-DD) | No | Filter to date |

**Response (200):**
```json
{
  "byCategory": [
    {
      "name": "fuel",
      "value": 500.50
    },
    {
      "name": "maintenance",
      "value": 350.00
    }
  ],
  "byDate": [
    {
      "date": "2024-01-15",
      "amount": 45.50
    },
    {
      "date": "2024-01-16",
      "amount": 38.75
    }
  ],
  "total": 850.50
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (not admin)

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production.

## Versioning

API versioning not implemented. Future versions may use `/api/v1/` prefix.

