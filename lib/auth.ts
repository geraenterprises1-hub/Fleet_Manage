import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './db';
import type { Profile, UserRole } from '@/types';

export interface JWTPayload {
  userId: string;
  role: string;
  email?: string;
  phone_number?: string;
}

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(
  emailOrPhone: string,
  password: string
): Promise<Profile | null> {
  if (!supabaseAdmin) {
    console.error('supabaseAdmin is not available');
    return null;
  }

  // Try to find user by email or phone_number
  let query = supabaseAdmin
    .from('profiles')
    .select('id, email, phone_number, vehicle_number, name, role, password_hash, created_at, updated_at');

  // Check if it's an email or phone number
  const isEmail = emailOrPhone.includes('@');
  
  if (isEmail) {
    query = query.eq('email', emailOrPhone.toLowerCase());
  } else {
    // Try phone_number first
    query = query.eq('phone_number', emailOrPhone.replace(/[\s\-\(\)]/g, ''));
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    console.error('[AUTH] Query error:', { error, isEmail, identifier: emailOrPhone });
    // If phone_number column doesn't exist, fallback to email
    if (!isEmail && (error?.message?.includes('phone_number') || error?.code === '42703')) {
      console.warn('phone_number column missing, trying email fallback');
      const fallbackQuery = supabaseAdmin
        .from('profiles')
        .select('id, email, name, role, password_hash, created_at, updated_at')
        .eq('email', emailOrPhone.toLowerCase());
      
      const fallbackResult = await fallbackQuery.maybeSingle();
      if (fallbackResult.error || !fallbackResult.data) {
        console.error('[AUTH] Fallback query failed:', fallbackResult.error);
        return null;
      }
      const fallbackUser = fallbackResult.data as any;
      const isValid = await comparePassword(password, fallbackUser.password_hash);
      if (!isValid) {
        console.error('[AUTH] Password mismatch for fallback user');
        return null;
      }
      return { ...fallbackUser, phone_number: undefined, vehicle_number: undefined } as Profile;
    }
    console.error('[AUTH] User not found:', { error, identifier: emailOrPhone });
    return null;
  }

  const isValid = await comparePassword(password, data.password_hash);
  if (!isValid) {
    console.error('[AUTH] Password mismatch for user:', data.email || data.phone_number);
    return null;
  }

  const userData = data as any;
  return userData as Profile;
}

export async function getUserById(userId: string): Promise<Profile | null> {
  if (!supabaseAdmin) {
    console.error('[AUTH] supabaseAdmin is not available. Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('[AUTH] Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      isServer: typeof window === 'undefined',
    });
    return null;
  }

  let query = supabaseAdmin
    .from('profiles')
    .select('id, email, phone_number, vehicle_number, name, role, created_at, updated_at')
    .eq('id', userId);

  const { data, error } = await query.single();

  if (error) {
    if (error.message.includes('phone_number') || error.code === '42703') {
      const fallbackQuery = supabaseAdmin
        .from('profiles')
        .select('id, email, name, role, created_at, updated_at')
        .eq('id', userId);
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.single();
      
      if (fallbackError || !fallbackData) {
        return null;
      }
      
      const fallbackUser = fallbackData as any;
      return { ...fallbackUser, phone_number: undefined, vehicle_number: undefined } as Profile;
    }
    
    console.error('getUserById error:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const userData = data as any;
  return userData as Profile;
}

export async function createUser(
  name: string,
  password: string,
  role: UserRole = 'driver',
  phoneNumber?: string,
  email?: string
): Promise<Profile | null> {
  if (!supabaseAdmin) {
    console.error('supabaseAdmin is not available');
    return null;
  }

  const passwordHash = await hashPassword(password);

  const insertData: any = {
    name,
    role,
    password_hash: passwordHash,
  };

  if (role === 'driver' && phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone && cleanPhone.length >= 10) {
      insertData.phone_number = cleanPhone;
    } else {
      console.error('Invalid phone number provided:', phoneNumber);
      return null;
    }
  } else if (email) {
    insertData.email = email.toLowerCase();
  } else {
    console.error('Either phoneNumber (for driver) or email (for admin) is required');
    return null;
  }

  let query = supabaseAdmin
    .from('profiles')
    .insert(insertData)
    .select('id, email, phone_number, vehicle_number, name, role, created_at, updated_at');

  let { data, error } = await query.single();

  if (error && (error.message.includes('phone_number') || error.message.includes('vehicle_number') || error.code === '42703')) {
    const insertDataWithoutVehicle: any = { ...insertData };
    if (error.message.includes('vehicle_number')) {
      delete insertDataWithoutVehicle.vehicle_number;
    }
    if (error.message.includes('phone_number')) {
      delete insertDataWithoutVehicle.phone_number;
    }
    
    const fallbackQuery = supabaseAdmin
      .from('profiles')
      .insert(insertDataWithoutVehicle)
      .select('id, email, name, role, created_at, updated_at');
    
    const fallbackResult = await fallbackQuery.single();
    if (fallbackResult.error) {
      console.error('createUser error:', fallbackResult.error);
      return null;
    }
    
    const fallbackUser = fallbackResult.data as any;
    return { ...fallbackUser, phone_number: undefined, vehicle_number: undefined } as Profile;
  }

  if (error) {
    console.error('createUser error:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const userData = data as any;
  return userData as Profile;
}

