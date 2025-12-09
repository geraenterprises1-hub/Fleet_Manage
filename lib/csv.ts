import type { Expense } from '@/types';

export function expensesToCSV(expenses: Expense[]): string {
  const headers = [
    'Date',
    'Driver',
    'Category',
    'Amount (₹)',
    'Total Revenue (₹)',
    'Uber Revenue (₹)',
    'Rapido Revenue (₹)',
    'Note',
  ];

  const rows = expenses.map((expense) => [
    expense.date,
    expense.driver_name || expense.driver_id,
    expense.category,
    expense.amount.toFixed(2),
    (expense.total_revenue || 0).toFixed(2),
    (expense.uber_revenue || 0).toFixed(2),
    (expense.rapido_revenue || 0).toFixed(2),
    expense.note || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

