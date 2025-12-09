// PUT /api/drivers/[id] - Update driver
// DELETE /api/drivers/[id] - Delete/revoke driver
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function deleteHandler(
  req: NextRequest & { user?: any },
  driverId: string
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Get driver info before deletion
    const { data: driver } = await supabaseAdmin
      .from('profiles')
      .select('id, role, name')
      .eq('id', driverId)
      .is('deleted_at', null)
      .single();

    if (!driver || (driver as any).role !== 'driver') {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Get vehicle number before unassigning
    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id, vehicle_number')
      .eq('driver_id', driverId)
      .maybeSingle();

    // Update all expenses to preserve driver name and vehicle number before soft delete
    const updateData: any = { driver_name: (driver as any).name };
    if (vehicle?.vehicle_number) {
      updateData.vehicle_number = vehicle.vehicle_number;
    }
    
    await supabaseAdmin
      .from('expenses')
      .update(updateData)
      .eq('driver_id', driverId)
      .is('driver_name', null);

    // Unassign vehicle if assigned (vehicle data already fetched above)
    if (vehicle) {
      await supabaseAdmin
        .from('vehicles')
        .update({ driver_id: null, status: 'available' })
        .eq('id', vehicle.id);
    }

    // Soft delete: Set deleted_at timestamp instead of hard delete
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', driverId);

    if (deleteError) {
      console.error('Soft delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete driver' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Driver removed successfully. All expense data has been preserved.',
      preserved: true
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest & { user?: any },
  driverId: string
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, phone_number, vehicle_id, password } = body;

    const updateData: any = {};
    
    if (name) updateData.name = name.trim();
    if (phone_number) {
      const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
      updateData.phone_number = cleanPhone;
    }
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      updateData.password_hash = await hashPassword(password);
    }

    // Update driver profile
    await (supabaseAdmin as any)
      .from('profiles')
      .update(updateData)
      .eq('id', driverId);

    // Handle vehicle assignment
    if (vehicle_id !== undefined) {
      // First, unassign current vehicle if any
      const { data: currentVehicle } = await supabaseAdmin
        .from('vehicles')
        .select('id')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (currentVehicle) {
        await supabaseAdmin
          .from('vehicles')
          .update({ driver_id: null, status: 'available' })
          .eq('id', currentVehicle.id);
      }

      // Assign new vehicle if provided
      if (vehicle_id) {
        const { data: newVehicle } = await supabaseAdmin
          .from('vehicles')
          .select('id, status, driver_id')
          .eq('id', vehicle_id)
          .single();

        if (!newVehicle) {
          return NextResponse.json(
            { error: 'Vehicle not found' },
            { status: 404 }
          );
        }

        if (newVehicle.driver_id && newVehicle.driver_id !== driverId) {
          return NextResponse.json(
            { error: 'Vehicle is already assigned to another driver' },
            { status: 400 }
          );
        }

        await supabaseAdmin
          .from('vehicles')
          .update({ driver_id: driverId, status: 'assigned' })
          .eq('id', vehicle_id);
      }
    }

    return NextResponse.json({ message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Update driver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: driverId } = await params;
  const wrappedHandler = async (authenticatedReq: NextRequest & { user?: any }) => {
    return deleteHandler(authenticatedReq, driverId);
  };
  return requireAdmin(wrappedHandler)(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: driverId } = await params;
  const wrappedHandler = async (authenticatedReq: NextRequest & { user?: any }) => {
    return putHandler(authenticatedReq, driverId);
  };
  return requireAdmin(wrappedHandler)(req);
}

