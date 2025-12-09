// GET /api/drivers - List all drivers with stats
// POST /api/drivers - Create new driver (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import { createUser } from '@/lib/auth';
import type { CreateDriverData, DriverStats } from '@/types';

async function getHandler(req: NextRequest & { user?: any }) {
  try {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is undefined. Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
      return NextResponse.json(
        { error: 'Database connection unavailable. Please check server configuration.' },
        { status: 500 }
      );
    }

    let driversQuery = supabaseAdmin
      .from('profiles')
      .select('id, phone_number, vehicle_number, name, role, created_at')
      .eq('role', 'driver')
      .is('deleted_at', null)
      .order('name');

    let { data: drivers, error: driversError } = await driversQuery;

    if (driversError && (driversError.message.includes('phone_number') || driversError.code === '42703')) {
      const fallbackQuery = supabaseAdmin
        .from('profiles')
        .select('id, email, name, role, created_at')
        .eq('role', 'driver')
        .order('name');
      
      const fallbackResult = await fallbackQuery;
      if (fallbackResult.data) {
        // Map fallback data to expected structure
        drivers = fallbackResult.data.map((d: any) => ({
          ...d,
          phone_number: d.email || '',
          vehicle_number: null,
        }));
      }
      driversError = fallbackResult.error;
    }

    if (driversError) {
      console.error('Get drivers error:', driversError);
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      );
    }

    const driversWithStats: DriverStats[] = await Promise.all(
      (drivers || []).map(async (driver: any) => {
        // Fetch assigned vehicle for this driver
        const { data: vehicleData } = await supabaseAdmin
          .from('vehicles')
          .select('vehicle_number')
          .eq('driver_id', driver.id)
          .maybeSingle();

        const vehicleNumber = vehicleData?.vehicle_number || undefined;

        return {
          driver_id: driver.id,
          driver_name: driver.name,
          driver_phone_number: driver.phone_number || driver.email || '',
          driver_vehicle_number: vehicleNumber,
        };
      })
    );

    return NextResponse.json({ data: driversWithStats });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function postHandler(req: NextRequest & { user?: any }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const body: CreateDriverData = await req.json();
    const { name, phone_number, password, vehicle_id } = body;

    if (!name || !phone_number || !password) {
      return NextResponse.json(
        { error: 'Name, phone number, and password are required' },
        { status: 400 }
      );
    }

    if (!vehicle_id) {
      return NextResponse.json(
        { error: 'Vehicle assignment is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
    
    if (!/^\d{10,}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Phone number must be at least 10 digits' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 400 }
      );
    }

    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id, status, driver_id')
      .eq('id', vehicle_id)
      .single();

    if (!vehicle || vehicle.status !== 'available' || vehicle.driver_id) {
      return NextResponse.json(
        { error: 'Selected vehicle is not available' },
        { status: 400 }
      );
    }

    const user = await createUser(name, password, 'driver', cleanPhone);
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create driver' },
        { status: 500 }
      );
    }

    await (supabaseAdmin as any)
      .from('vehicles')
      .update({ driver_id: user.id, status: 'assigned' })
      .eq('id', vehicle_id);

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('Create driver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(getHandler);
export const POST = requireAdmin(postHandler);

