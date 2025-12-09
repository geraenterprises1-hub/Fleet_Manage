import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import type { LoginCredentials } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: LoginCredentials = await req.json();
    const { email, phone_number, password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const identifier = email || phone_number;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(identifier, password);
    if (!user) {
      console.error('[LOGIN] Authentication failed:', {
        identifier,
        hasSupabaseAdmin: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      phone_number: user.phone_number,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone_number: user.phone_number,
        vehicle_number: user.vehicle_number,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

