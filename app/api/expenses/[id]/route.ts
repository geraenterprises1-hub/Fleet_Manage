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
    if (role === 'driver' && existingExpense.driver_id !== userId) {
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

    if (amountStr !== null) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        updateData.amount = amount;
      }
    }

    if (note !== null) {
      updateData.note = note || null;
    }

    if (purpose !== null) {
      updateData.purpose = purpose || null;
    }

    if (total_revenueStr !== null) {
      const total_revenue = parseFloat(total_revenueStr);
      if (!isNaN(total_revenue)) {
        updateData.total_revenue = total_revenue;
      }
    }

    if (uber_revenueStr !== null) {
      const uber_revenue = parseFloat(uber_revenueStr);
      if (!isNaN(uber_revenue)) {
        updateData.uber_revenue = uber_revenue;
      }
    }

    if (rapido_revenueStr !== null) {
      const rapido_revenue = parseFloat(rapido_revenueStr);
      if (!isNaN(rapido_revenue)) {
        updateData.rapido_revenue = rapido_revenue;
      }
    }

    // Handle receipt uploads
    const receipts = formData.getAll('receipts') as File[];
    if (receipts.length > 0 && receipts[0].size > 0) {
      const receiptUrls = await uploadMultipleReceipts(receipts.filter(f => f.size > 0));
      if (receiptUrls.length > 0) {
        updateData.receipt_url = JSON.stringify(receiptUrls);
      }
    }

    // Handle Uber proof
    const uber_proof = formData.get('uber_proof') as File | null;
    if (uber_proof && uber_proof.size > 0) {
      const { uploadReceipt } = await import('@/lib/storage');
      const uber_proof_url = await uploadReceipt(uber_proof);
      if (uber_proof_url) {
        updateData.uber_proof_url = uber_proof_url;
      }
    }

    // Handle Rapido proof
    const rapido_proof = formData.get('rapido_proof') as File | null;
    if (rapido_proof && rapido_proof.size > 0) {
      const { uploadReceipt } = await import('@/lib/storage');
      const rapido_proof_url = await uploadReceipt(rapido_proof);
      if (rapido_proof_url) {
        updateData.rapido_proof_url = rapido_proof_url;
      }
    }

    // Update expense
    const { data: updatedExpense, error: updateError } = await supabaseAdmin
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select()
      .single();

    if (updateError) {
      console.error('[EXPENSES PUT] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update expense', details: updateError.message },
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
    if (role === 'driver' && existingExpense.driver_id !== userId) {
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

