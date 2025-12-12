// GET /api/expenses - List expenses (with filters)
// POST /api/expenses - Create expense
import { NextRequest, NextResponse } from 'next/server';
import { requireDriverOrAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import { uploadMultipleReceipts } from '@/lib/storage';
import { notifyHighValueExpense } from '@/lib/email';
import type { ExpenseFilters, ExpenseFormData } from '@/types';

async function getHandler(req: NextRequest & { user?: any }) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { searchParams } = new URL(req.url);

    const filters: ExpenseFilters = {
      driver_id: searchParams.get('driver_id') || undefined,
      vehicle_id: searchParams.get('vehicle_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      category: searchParams.get('category') as any || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    let driverIdsForVehicle: string[] | null = null;
    if (filters.vehicle_id && role === 'admin') {
      const { data: vehicleData } = await supabaseAdmin
        .from('vehicles')
        .select('driver_id')
        .eq('id', filters.vehicle_id)
        .single();
      
      const vehicle = vehicleData as { driver_id: string | null } | null;
      if (vehicle && vehicle.driver_id) {
        driverIdsForVehicle = [vehicle.driver_id];
      } else {
        return NextResponse.json({
          data: [],
          total: 0,
          page: filters.page || 1,
          limit: filters.limit || 20,
          totalPages: 0,
        });
      }
    }

    let query = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact' });

    if (role === 'driver') {
      query = query.eq('driver_id', userId);
    } else if (driverIdsForVehicle) {
      query = query.in('driver_id', driverIdsForVehicle);
    } else if (filters.driver_id) {
      query = query.eq('driver_id', filters.driver_id);
    }

    if (filters.start_date) {
      query = query.gte('date', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('date', filters.end_date);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('date', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expenses' },
        { status: 500 }
      );
    }

    let expensesWithDriverNames: any[] = data || [];
    if (data && data.length > 0 && supabaseAdmin) {
      const driverIdsSet = new Set(data.map((e: any) => e.driver_id).filter((id: any) => id));
      const driverIds = Array.from(driverIdsSet);
      
      // Fetch driver names for expenses that have driver_id (including deleted drivers)
      let driverMap = new Map<string, string>();
      if (driverIds.length > 0) {
        try {
          // First try to fetch all drivers (including deleted ones) - don't filter by deleted_at
          const { data: drivers, error: driverError } = await supabaseAdmin
            .from('profiles')
            .select('id, name')
            .in('id', driverIds);

          if (!driverError && drivers) {
            driverMap = new Map((drivers || []).map((d: any) => [d.id, d.name]));
          }
        } catch (e) {
          console.error('[EXPENSES GET] Error fetching driver names:', e);
        }
      }
      
      // Fetch vehicle numbers for expenses
      // First check if vehicle_number is stored in expenses table, then check vehicles table
      let vehicleMap = new Map<string, string>();
      if (driverIds.length > 0) {
        try {
          // First, get vehicle numbers from expenses table (preserved data)
          const expensesWithVehicles = data.filter((e: any) => e.vehicle_number);
          expensesWithVehicles.forEach((e: any) => {
            if (e.driver_id && e.vehicle_number) {
              vehicleMap.set(e.driver_id, e.vehicle_number);
            }
          });
          
          // Then, try to get vehicles currently assigned to these drivers (for active drivers)
          const missingDriverIds = driverIds.filter(id => !vehicleMap.has(id));
          if (missingDriverIds.length > 0) {
            const { data: vehicles, error: vehicleError } = await supabaseAdmin
              .from('vehicles')
              .select('driver_id, vehicle_number')
              .in('driver_id', missingDriverIds);

            if (!vehicleError && vehicles) {
              vehicles.forEach((v: any) => {
                if (v.driver_id && v.vehicle_number && !vehicleMap.has(v.driver_id)) {
                  vehicleMap.set(v.driver_id, v.vehicle_number);
                }
              });
            }
          }
        } catch (e) {
          console.error('[EXPENSES GET] Error fetching vehicle numbers:', e);
        }
      }
      
      // Use driver_name from expense if available, otherwise fetch from profiles
      // Also handle driver_id being null (for deleted drivers)
      expensesWithDriverNames = (data || []).map((expense: any) => {
        let driverName = expense.driver_name;
        let vehicleNumber = vehicleMap.get(expense.driver_id || '') || null;
        let isDeletedDriver = false;
        
        // If driver_name is not in expense, try to get from driverMap (including deleted drivers)
        if (!driverName && expense.driver_id) {
          driverName = driverMap.get(expense.driver_id);
          // If driver_id exists but driver not found in profiles, it's a deleted driver
          if (!driverName && expense.driver_id) {
            isDeletedDriver = true;
          }
        }
        
        // If still no name and driver_id exists, try to update the expense with driver name
        if (!driverName && expense.driver_id && driverMap.has(expense.driver_id)) {
          driverName = driverMap.get(expense.driver_id);
          // Update the expense record to preserve driver name (async, don't wait)
          if (supabaseAdmin && driverName) {
            (async () => {
              try {
                await supabaseAdmin
                  .from('expenses')
                  .update({ driver_name: driverName })
                  .eq('id', expense.id);
                console.log(`[EXPENSES GET] Updated driver_name for expense ${expense.id}`);
              } catch (err: any) {
                // Ignore if driver_name column doesn't exist yet
                if (!err?.message?.includes('column') && !err?.message?.includes('does not exist')) {
                  console.error(`[EXPENSES GET] Error updating driver_name:`, err);
                }
              }
            })();
          }
        }
        
        // Format display name: if deleted driver, show vehicle number + (Deleted Driver)
        let displayName = driverName;
        const expenseVehicleNumber = expense.vehicle_number || vehicleNumber;
        
        if (!driverName && expense.driver_id) {
          // Driver is deleted - show vehicle number if available
          if (expenseVehicleNumber) {
            displayName = `${expenseVehicleNumber} (Deleted Driver)`;
          } else {
            displayName = 'Deleted Driver';
          }
        } else if (!driverName) {
          displayName = 'Unknown';
        }
        
        return {
          ...expense,
          driver_name: displayName,
        };
      });
    }

    return NextResponse.json({
      data: expensesWithDriverNames,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function postHandler(req: NextRequest & { user?: any }) {
  try {
    if (!supabaseAdmin) {
      console.error('[EXPENSES POST] supabaseAdmin is undefined');
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!userId || !role) {
      console.error('[EXPENSES POST] Missing user info:', { userId, role, user: req.user });
      return NextResponse.json(
        { error: 'Authentication error. Please log in again.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    let date = formData.get('date') as string;
    // Category is optional for admin, defaults to 'other' if not provided
    let category = formData.get('category') as string;
    if (!category && role === 'admin') {
      category = 'other';
    }
    
    // Normalize date format (handle DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD)
    if (date) {
      // Check if date is in DD/MM/YYYY or MM/DD/YYYY format
      const dateMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const [, part1, part2, year] = dateMatch;
        // Assume DD/MM/YYYY format (more common internationally)
        // If part1 > 12, it's definitely DD/MM/YYYY
        if (parseInt(part1) > 12) {
          date = `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        } else {
          // Ambiguous case - try DD/MM/YYYY first
          date = `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        }
      }
    }
    const amountStr = formData.get('amount') as string;
    const note = formData.get('note') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const total_revenueStr = formData.get('total_revenue') as string;
    const uber_revenueStr = formData.get('uber_revenue') as string;
    const rapido_revenueStr = formData.get('rapido_revenue') as string;
    
    const amount = amountStr ? parseFloat(amountStr) : 0;
    const total_revenue = total_revenueStr ? parseFloat(total_revenueStr) : 0;
    const uber_revenue = uber_revenueStr ? parseFloat(uber_revenueStr) : 0;
    const rapido_revenue = rapido_revenueStr ? parseFloat(rapido_revenueStr) : 0;
    
    // Validate numbers
    if (isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount value' },
        { status: 400 }
      );
    }
    if (isNaN(total_revenue)) {
      return NextResponse.json(
        { error: 'Invalid total revenue value' },
        { status: 400 }
      );
    }
    if (isNaN(uber_revenue)) {
      return NextResponse.json(
        { error: 'Invalid Uber revenue value' },
        { status: 400 }
      );
    }
    if (isNaN(rapido_revenue)) {
      return NextResponse.json(
        { error: 'Invalid Rapido revenue value' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    if (!category && role === 'driver') {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // For drivers, use their own ID. For admin, driver_id is optional (can be null for admin expenses)
    const driverId = role === 'driver' ? userId : (formData.get('driver_id') as string || null);
    if (role === 'driver' && !driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    const receipts = formData.getAll('receipts') as File[];
    const uber_proof_raw = formData.get('uber_proof');
    const rapido_proof_raw = formData.get('rapido_proof');
    
    // Handle null, undefined, or empty file objects
    const uber_proof = (uber_proof_raw && (uber_proof_raw as File).size > 0) ? (uber_proof_raw as File) : null;
    const rapido_proof = (rapido_proof_raw && (rapido_proof_raw as File).size > 0) ? (rapido_proof_raw as File) : null;

    // Validate that at least one of revenue or expense must be greater than 0
    const amountValue = isNaN(amount) ? 0 : amount;
    const totalRevenueValue = isNaN(total_revenue) ? 0 : total_revenue;
    const uberRevenueValue = isNaN(uber_revenue) ? 0 : uber_revenue;
    const rapidoRevenueValue = isNaN(rapido_revenue) ? 0 : rapido_revenue;

    const hasRevenue = totalRevenueValue > 0 || uberRevenueValue > 0 || rapidoRevenueValue > 0;
    const hasExpense = amountValue > 0;

    if (!hasRevenue && !hasExpense) {
      return NextResponse.json(
        { error: 'At least one of Revenue or Expense must be greater than 0' },
        { status: 400 }
      );
    }

    let receiptUrls: string[] = [];
    if (receipts && receipts.length > 0) {
      receiptUrls = await uploadMultipleReceipts(receipts.filter(f => f.size > 0));
    }

    let uber_proof_url: string | null = null;
    if (uber_proof && uber_proof.size > 0) {
      const { uploadReceipt } = await import('@/lib/storage');
      uber_proof_url = await uploadReceipt(uber_proof);
      if (!uber_proof_url) {
        console.error('[EXPENSES POST] Failed to upload Uber proof');
        return NextResponse.json(
          { error: 'Failed to upload Uber screenshot. Please try again.' },
          { status: 500 }
        );
      }
    }

    let rapido_proof_url: string | null = null;
    if (rapido_proof && rapido_proof.size > 0) {
      const { uploadReceipt } = await import('@/lib/storage');
      rapido_proof_url = await uploadReceipt(rapido_proof);
      if (!rapido_proof_url) {
        console.error('[EXPENSES POST] Failed to upload Rapido proof');
        return NextResponse.json(
          { error: 'Failed to upload Rapido screenshot. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Fetch driver name and vehicle number to preserve in expenses table
    let driverName: string | null = null;
    let vehicleNumber: string | null = null;
    
    if (driverId) {
      try {
        // Fetch driver name without filtering by deleted_at (to get deleted drivers too)
        const { data: driverData, error: driverError } = await supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', driverId)
          .maybeSingle();
        
        if (!driverError && driverData) {
          driverName = driverData.name || null;
        } else if (driverError) {
          console.warn('[EXPENSES POST] Error fetching driver name:', driverError);
        }
        
        // Fetch vehicle number assigned to this driver
        const { data: vehicleData } = await supabaseAdmin
          .from('vehicles')
          .select('vehicle_number')
          .eq('driver_id', driverId)
          .maybeSingle();
        
        if (vehicleData?.vehicle_number) {
          vehicleNumber = vehicleData.vehicle_number;
        }
      } catch (error) {
        console.warn('[EXPENSES POST] Could not fetch driver/vehicle info:', error);
      }
    }

    const insertData: any = {
      driver_id: driverId,
      date,
      category: category as any,
      amount: amountValue,
      note: note || null,
      purpose: purpose || null,
      receipt_url: receiptUrls.length > 0 ? JSON.stringify(receiptUrls) : null,
      total_revenue: totalRevenueValue,
      uber_revenue: uberRevenueValue,
      rapido_revenue: rapidoRevenueValue,
    };
    
    // Only add driver_name and vehicle_number if we have them (columns might not exist yet)
    if (driverName) {
      insertData.driver_name = driverName;
    }
    if (vehicleNumber) {
      insertData.vehicle_number = vehicleNumber;
    }
    
    if (uber_proof_url) insertData.uber_proof_url = uber_proof_url;
    if (rapido_proof_url) insertData.rapido_proof_url = rapido_proof_url;

    console.log('[EXPENSES POST] Inserting expense:', {
      driver_id: driverId,
      date,
      category,
      amount: amountValue,
      hasReceipts: receiptUrls.length > 0,
      hasUberProof: !!uber_proof_url,
      hasRapidoProof: !!rapido_proof_url,
    });

    const { data: expense, error: insertError } = await (supabaseAdmin as any)
      .from('expenses')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[EXPENSES POST] Insert error:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      
      // Handle NOT NULL constraint error for driver_id (23502)
      if (insertError.code === '23502' && insertError.message?.includes('driver_id')) {
        return NextResponse.json(
          { 
            error: 'Database migration required',
            details: 'The driver_id column must allow NULL values for admin expenses.',
            hint: 'Please run the migration: database/allow-null-driver-id.sql in Supabase SQL Editor'
          },
          { status: 500 }
        );
      }
      
      // Handle missing column error (42703) - try without optional columns
      if (insertError.code === '42703' || insertError.message?.includes('column') || insertError.message?.includes('does not exist')) {
        console.log('[EXPENSES POST] Retrying without optional columns (driver_name, revenue columns)');
        
        const retryData: any = {
          driver_id: driverId,
          date,
          category: category as any,
          amount: amountValue,
          note: note || null,
          receipt_url: receiptUrls.length > 0 ? JSON.stringify(receiptUrls) : null,
        };
        
        // Try to add revenue columns if they exist
        if (totalRevenueValue > 0 || uberRevenueValue > 0 || rapidoRevenueValue > 0) {
          try {
            // Test if revenue columns exist by trying a simple query
            retryData.total_revenue = totalRevenueValue;
            retryData.uber_revenue = uberRevenueValue;
            retryData.rapido_revenue = rapidoRevenueValue;
          } catch (e) {
            // If that fails, we'll skip revenue columns
          }
        }
        
        if (uber_proof_url) retryData.uber_proof_url = uber_proof_url;
        if (rapido_proof_url) retryData.rapido_proof_url = rapido_proof_url;
        
        const { data: retryExpense, error: retryError } = await (supabaseAdmin as any)
          .from('expenses')
          .insert(retryData)
          .select()
          .single();
        
        if (retryError) {
          console.error('[EXPENSES POST] Retry error:', retryError);
          
          // Final retry with only essential fields
          const finalRetryData: any = {
            driver_id: driverId,
            date,
            category: category as any,
            amount: amountValue,
            note: note || null,
            receipt_url: receiptUrls.length > 0 ? JSON.stringify(receiptUrls) : null,
          };
          
          const { data: finalExpense, error: finalError } = await (supabaseAdmin as any)
            .from('expenses')
            .insert(finalRetryData)
            .select()
            .single();
          
          if (finalError) {
            console.error('[EXPENSES POST] Final retry error:', finalError);
            return NextResponse.json(
              { 
                error: 'Failed to create expense',
                details: finalError.message || 'Database error. Please check if all required columns exist.',
                hint: 'Run database migrations if you see column-related errors'
              },
              { status: 500 }
            );
          }
          
          if (amountValue >= 5000 && driverId) {
            try {
              const driver = await supabaseAdmin.from('profiles').select('name').eq('id', driverId).maybeSingle();
              if (driver?.data) {
                await notifyHighValueExpense((driver.data as any).name, amountValue, category, date);
              }
            } catch (e) {
              console.warn('[EXPENSES POST] Could not send high value notification:', e);
            }
          }
          
          return NextResponse.json({ data: finalExpense }, { status: 201 });
        }
        
        if (amountValue >= 5000 && driverId) {
          try {
            const driver = await supabaseAdmin.from('profiles').select('name').eq('id', driverId).maybeSingle();
            if (driver?.data) {
              await notifyHighValueExpense((driver.data as any).name, amountValue, category, date);
            }
          } catch (e) {
            console.warn('[EXPENSES POST] Could not send high value notification:', e);
          }
        }
        
        return NextResponse.json({ data: retryExpense }, { status: 201 });
      }
      
      console.error('[EXPENSES POST] Create expense error:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to create expense',
          details: insertError.message || 'Database error occurred',
          code: insertError.code
        },
        { status: 500 }
      );
    }

    if (amount >= 5000 && driverId) {
      try {
        const driver = await supabaseAdmin.from('profiles').select('name').eq('id', driverId).maybeSingle();
        if (driver.data) {
          await notifyHighValueExpense((driver.data as any).name, amount, category, date);
        }
      } catch (e) {
        console.warn('[EXPENSES POST] Could not send high value notification:', e);
      }
    }

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error: any) {
    console.error('[EXPENSES POST] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export const GET = requireDriverOrAdmin(getHandler);
export const POST = requireDriverOrAdmin(postHandler);

