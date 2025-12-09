// Type definitions for the Fleet Management System

export type UserRole = 'admin' | 'driver';

export interface Profile {
  id: string;
  email?: string; // Optional for drivers, required for admin
  phone_number?: string; // Required for drivers, optional for admin
  vehicle_number?: string; // Optional vehicle number for drivers
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  driver_id: string | null; // Can be null if driver is deleted
  driver_name?: string; // Driver name (preserved even after driver deletion)
  vehicle_number?: string; // Vehicle number (preserved even after driver deletion)
  date: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  receipt_url?: string; // Can be single URL or JSON array of URLs
  total_revenue?: number;
  uber_revenue?: number;
  rapido_revenue?: number;
  uber_proof_url?: string;
  rapido_proof_url?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = 'fuel' | 'maintenance' | 'toll' | 'other';

export interface ExpenseFormData {
  date: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  receipt?: File; // Deprecated - use receipts instead
  receipts?: File[]; // Multiple receipts
  total_revenue?: number;
  uber_revenue?: number;
  rapido_revenue?: number;
  uber_proof?: File;
  rapido_proof?: File;
}

export interface DriverStats {
  driver_id: string;
  driver_name: string;
  driver_phone_number: string;
  driver_vehicle_number?: string;
}

export interface ExpenseFilters {
  driver_id?: string;
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  category?: ExpenseCategory;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: Profile;
  token: string;
}

export interface LoginCredentials {
  email?: string; // For admin login
  phone_number?: string; // For driver login
  password: string;
}

export interface CreateDriverData {
  name: string;
  phone_number: string;
  password: string;
  vehicle_id?: string; // Vehicle ID from vehicles table
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  driver_id?: string;
  driver_name?: string; // Populated when driver is assigned
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  vehicle_number: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
}

export interface UpdateVehicleData {
  vehicle_number?: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  status?: 'available' | 'assigned' | 'maintenance' | 'retired';
  driver_id?: string | null;
}

