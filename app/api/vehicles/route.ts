// GET /api/vehicles - List all vehicles
// POST /api/vehicles - Create new vehicle (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import type { CreateVehicleData, Vehicle } from '@/types';

async function getHandler(req: NextRequest & { user?: any }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from('vehicles')
      .select(`
        id,
        vehicle_number,
        vehicle_type,
        make,
        model,
        year,
        color,
        status,
        driver_id,
        created_at,
        updated_at,
        profiles:driver_id (
          id,
          name
        )
      `)
      .order('vehicle_number');

    if (vehiclesError) {
      if (vehiclesError.message?.includes('relation "vehicles" does not exist') || vehiclesError.code === '42P01') {
        return NextResponse.json(
          { error: 'Vehicles table does not exist. Please run the database migration: database/add-vehicles-table.sql', code: 'TABLE_NOT_FOUND' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch vehicles: ${vehiclesError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    const vehiclesWithDriver: Vehicle[] = (vehicles || []).map((v: any) => ({
      id: v.id,
      vehicle_number: v.vehicle_number,
      vehicle_type: v.vehicle_type || undefined,
      make: v.make || undefined,
      model: v.model || undefined,
      year: v.year || undefined,
      color: v.color || undefined,
      status: v.status,
      driver_id: v.driver_id || undefined,
      driver_name: v.profiles?.name || undefined,
      created_at: v.created_at,
      updated_at: v.updated_at,
    }));

    return NextResponse.json({ data: vehiclesWithDriver });
  } catch (error) {
    console.error('Get vehicles error:', error);
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

    const body: CreateVehicleData = await req.json();
    const { vehicle_number, vehicle_type, make, model, year, color } = body;

    if (!vehicle_number || !vehicle_number.trim()) {
      return NextResponse.json(
        { error: 'Vehicle number is required' },
        { status: 400 }
      );
    }

    const cleanVehicleNumber = vehicle_number.trim().toUpperCase();

    const { data: existing } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('vehicle_number', cleanVehicleNumber)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Vehicle number already exists' },
        { status: 400 }
      );
    }

    const { data: vehicle, error: createError } = await supabaseAdmin
      .from('vehicles')
      .insert({
        vehicle_number: cleanVehicleNumber,
        vehicle_type: vehicle_type || 'cab',
        make: make?.trim() || null,
        model: model?.trim() || null,
        year: year || null,
        color: color?.trim() || null,
        status: 'available',
      })
      .select()
      .single();

    if (createError) {
      console.error('Create vehicle error:', createError);
      return NextResponse.json(
        { error: 'Failed to create vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(getHandler);
export const POST = requireAdmin(postHandler);
