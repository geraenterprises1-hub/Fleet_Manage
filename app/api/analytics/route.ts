// GET /api/analytics - Get analytics data
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/db';

async function handler(req: NextRequest & { user?: any }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

    let query = supabaseAdmin
      .from('expenses')
      .select('date, category, amount, total_revenue, uber_revenue, rapido_revenue');

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Analytics error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    const expenses = (data || []).map((e: any) => ({
      date: e.date,
      category: e.category,
      amount: Number(e.amount) || 0,
      total_revenue: Number(e.total_revenue) || 0,
      uber_revenue: Number(e.uber_revenue) || 0,
      rapido_revenue: Number(e.rapido_revenue) || 0,
    }));

    const byCategory = expenses.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const byDate = expenses.reduce((acc: any, e: any) => {
      if (!acc[e.date]) {
        acc[e.date] = { expenses: 0, revenue: 0 };
      }
      acc[e.date].expenses += e.amount;
      acc[e.date].revenue += e.total_revenue;
      return acc;
    }, {});

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = expenses.reduce((sum, e) => sum + e.total_revenue, 0);

    return NextResponse.json({
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      byDate: Object.entries(byDate).map(([date, data]: [string, any]) => ({
        date,
        expenses: data.expenses,
        revenue: data.revenue,
      })),
      totalExpenses,
      totalRevenue,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(handler);

