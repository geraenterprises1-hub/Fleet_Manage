// PUT /api/vehicles/[id] - Update vehicle
// DELETE /api/vehicles/[id] - Delete vehicle
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import type { UpdateVehicleData } from '@/types';

async function putHandler(
  req: NextRequest & { user?: any },
  vehicleId: string
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const body: UpdateVehicleData = await req.json();
    const { vehicle_number, vehicle_type, make, model, year, color, status, driver_id } = body;

    const updateData: any = {};
    
    if (vehicle_number !== undefined) {
      updateData.vehicle_number = vehicle_number.trim().toUpperCase();
    }
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
    if (make !== undefined) updateData.make = make?.trim() || null;
    if (model !== undefined) updateData.model = model?.trim() || null;
    if (year !== undefined) updateData.year = year || null;
    if (color !== undefined) updateData.color = color?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (driver_id !== undefined) {
      updateData.driver_id = driver_id || null;
      if (driver_id) {
        updateData.status = 'assigned';
      }
    }

    await (supabaseAdmin as any)
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleId);

    return NextResponse.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  req: NextRequest & { user?: any },
  vehicleId: string
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id, driver_id')
      .eq('id', vehicleId)
      .single();

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if ((vehicle as any).driver_id) {
      return NextResponse.json(
        { error: 'Cannot delete vehicle that is assigned to a driver' },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    return NextResponse.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const wrappedHandler = async (authenticatedReq: NextRequest & { user?: any }) => {
    return putHandler(authenticatedReq, vehicleId);
  };
  return requireAdmin(wrappedHandler)(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const wrappedHandler = async (authenticatedReq: NextRequest & { user?: any }) => {
    return deleteHandler(authenticatedReq, vehicleId);
  };
  return requireAdmin(wrappedHandler)(req);
}
