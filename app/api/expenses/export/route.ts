// GET /api/expenses/export - Export expenses to CSV
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import { expensesToCSV } from '@/lib/csv';

async function handler(req: NextRequest & { user?: any }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);

    const driverId = searchParams.get('driver_id') || undefined;
    const vehicleId = searchParams.get('vehicle_id') || undefined;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const category = searchParams.get('category') || undefined;

    let driverIdsForVehicle: string[] | null = null;
    if (vehicleId) {
      const { data: vehicleData } = await supabaseAdmin
        .from('vehicles')
        .select('driver_id')
        .eq('id', vehicleId)
        .single();
      
      const vehicle = vehicleData as { driver_id: string | null } | null;
      if (vehicle && vehicle.driver_id) {
        driverIdsForVehicle = [vehicle.driver_id];
      } else {
        return new NextResponse('', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="expenses-${Date.now()}.csv"`,
          },
        });
      }
    }

    let query = supabaseAdmin.from('expenses').select('*');

    if (driverIdsForVehicle) {
      query = query.in('driver_id', driverIdsForVehicle);
    } else if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Export error:', error);
      return NextResponse.json(
        { error: 'Failed to export expenses' },
        { status: 500 }
      );
    }

    if (data && data.length > 0) {
      const driverIds = Array.from(new Set(data.map((e: any) => e.driver_id)));
      const { data: drivers } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .in('id', driverIds);

      const driverMap = new Map((drivers || []).map((d: any) => [d.id, d.name]));
      const expensesWithNames = (data || []).map((expense: any) => ({
        ...expense,
        driver_name: driverMap.get(expense.driver_id) || null,
      }));

      const csvContent = expensesToCSV(expensesWithNames);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="expenses-${Date.now()}.csv"`,
        },
      });
    }

    return new NextResponse('', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(handler);

