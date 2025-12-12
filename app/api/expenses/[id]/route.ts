// PUT /api/expenses/[id] - Update expense
// DELETE /api/expenses/[id] - Delete expense
import { NextRequest, NextResponse } from 'next/server';
import { requireDriverOrAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';
import { uploadMultipleReceipts } from '@/lib/storage';

async function putHandler(
  req: NextRequest & { user?: any },
  expenseId: string
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Authentication error. Please log in again.' },
        { status: 401 }
      );
    }

    // Check if expense exists and user has permission
    const { data: existingExpense, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('driver_id')
      .eq('id', expenseId)
      .single();

    if (fetchError || !existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Drivers can only update their own expenses, admins can update any
    // Handle null driver_id (admin expenses)
    if (role === 'driver' && existingExpense.driver_id && existingExpense.driver_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this expense' },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    let date = formData.get('date') as string | null;
    const category = formData.get('category') as string | null;
    const amountStr = formData.get('amount') as string | null;
    const note = formData.get('note') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const total_revenueStr = formData.get('total_revenue') as string | null;
    const uber_revenueStr = formData.get('uber_revenue') as string | null;
    const rapido_revenueStr = formData.get('rapido_revenue') as string | null;

    const updateData: any = {};

    if (date) {
      // Normalize date format
      const dateMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const [, part1, part2, year] = dateMatch;
        if (parseInt(part1) > 12) {
          date = `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        } else {
          date = `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
        }
      }
      updateData.date = date;
    }

    if (category) {
      updateData.category = category;
    }

    if (amountStr !== null && amountStr.trim()) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        updateData.amount = Math.round(amount);
      }
    }

    if (note !== null) {
      updateData.note = note && note.trim() ? note.trim() : null;
    }

    if (purpose !== null) {
      updateData.purpose = purpose && purpose.trim() ? purpose.trim() : null;
    }

    if (total_revenueStr !== null && total_revenueStr.trim()) {
      const total_revenue = parseFloat(total_revenueStr);
      if (!isNaN(total_revenue)) {
        updateData.total_revenue = Math.round(total_revenue);
      }
    }

    if (uber_revenueStr !== null && uber_revenueStr.trim()) {
      const uber_revenue = parseFloat(uber_revenueStr);
      if (!isNaN(uber_revenue)) {
        updateData.uber_revenue = Math.round(uber_revenue);
      }
    }

    if (rapido_revenueStr !== null && rapido_revenueStr.trim()) {
      const rapido_revenue = parseFloat(rapido_revenueStr);
      if (!isNaN(rapido_revenue)) {
        updateData.rapido_revenue = Math.round(rapido_revenue);
      }
    }

    // Handle receipt uploads
    try {
      const receipts = formData.getAll('receipts') as File[];
      if (receipts.length > 0 && receipts[0].size > 0) {
        const receiptUrls = await uploadMultipleReceipts(receipts.filter(f => f.size > 0));
        if (receiptUrls.length > 0) {
          updateData.receipt_url = JSON.stringify(receiptUrls);
        }
      }
    } catch (error: any) {
      console.error('[EXPENSES PUT] Error uploading receipts:', error);
      // Don't fail the entire update if receipt upload fails
    }

    // Handle Uber proof
    try {
      const uber_proof = formData.get('uber_proof') as File | null;
      if (uber_proof && uber_proof.size > 0) {
        const { uploadReceipt } = await import('@/lib/storage');
        const uber_proof_url = await uploadReceipt(uber_proof);
        if (uber_proof_url) {
          updateData.uber_proof_url = uber_proof_url;
        }
      }
    } catch (error: any) {
      console.error('[EXPENSES PUT] Error uploading Uber proof:', error);
      // Don't fail the entire update if proof upload fails
    }

    // Handle Rapido proof
    try {
      const rapido_proof = formData.get('rapido_proof') as File | null;
      if (rapido_proof && rapido_proof.size > 0) {
        const { uploadReceipt } = await import('@/lib/storage');
        const rapido_proof_url = await uploadReceipt(rapido_proof);
        if (rapido_proof_url) {
          updateData.rapido_proof_url = rapido_proof_url;
        }
      }
    } catch (error: any) {
      console.error('[EXPENSES PUT] Error uploading Rapido proof:', error);
      // Don't fail the entire update if proof upload fails
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Clean up updateData - remove undefined values and ensure proper types
    const cleanedUpdateData: any = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== '') {
        cleanedUpdateData[key] = value;
      }
    }

    if (Object.keys(cleanedUpdateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update expense
    const { data: updatedExpense, error: updateError } = await supabaseAdmin
      .from('expenses')
      .update(cleanedUpdateData)
      .eq('id', expenseId)
      .select()
      .single();

    if (updateError) {
      console.error('[EXPENSES PUT] Update error:', updateError);
      console.error('[EXPENSES PUT] Update data:', cleanedUpdateData);
      console.error('[EXPENSES PUT] Expense ID:', expenseId);
      console.error('[EXPENSES PUT] Error code:', updateError.code);
      console.error('[EXPENSES PUT] Error details:', updateError.details);
      console.error('[EXPENSES PUT] Error hint:', updateError.hint);
      
      // Handle specific database errors
      if (updateError.code === '42703' || updateError.message?.includes('column') || updateError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database schema mismatch', 
            details: 'One or more columns do not exist in the database. Please check database migrations.',
            code: updateError.code
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to update expense', 
          details: updateError.message || 'Database error occurred',
          code: updateError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedExpense }, { status: 200 });
  } catch (error: any) {
    console.error('[EXPENSES PUT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  req: NextRequest & { user?: any },
  expenseId: string
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Authentication error. Please log in again.' },
        { status: 401 }
      );
    }

    // Check if expense exists and user has permission
    const { data: existingExpense, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('driver_id')
      .eq('id', expenseId)
      .single();

    if (fetchError || !existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Drivers can only delete their own expenses, admins can delete any
    // Handle null driver_id (admin expenses)
    if (role === 'driver' && existingExpense.driver_id && existingExpense.driver_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this expense' },
        { status: 403 }
      );
    }

    // Delete expense
    const { error: deleteError } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (deleteError) {
      console.error('[EXPENSES DELETE] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete expense', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[EXPENSES DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: expenseId } = await params;
  const wrappedHandler = async (authenticatedReq: NextRequest & { user?: any }) => {
    return putHandler(authenticatedReq, expenseId);
  };
  return requireDriverOrAdmin(wrappedHandler)(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: expenseId } = await params;
  const wrappedHandler = async (authenticatedReq: NextRequest & { user?: any }) => {
    return deleteHandler(authenticatedReq, expenseId);
  };
  return requireDriverOrAdmin(wrappedHandler)(req);
}

