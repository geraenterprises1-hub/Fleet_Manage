import * as XLSX from 'xlsx';
import type { Expense } from '@/types';

export function expensesToExcel(expenses: Expense[]): Buffer {
  // Prepare headers
  const headers = [
    'Date',
    'Driver',
    'Vehicle Number',
    'Category',
    'Amount (₹)',
    'Total Revenue (₹)',
    'Uber Revenue (₹)',
    'Rapido Revenue (₹)',
    'Note',
    'Receipts',
    'Uber Proof',
    'Rapido Proof',
  ];

  // Prepare data rows
  const rows = expenses.map((expense: any) => {
    let receiptUrls = '';
    if (expense.receipt_url) {
      try {
        const parsed = JSON.parse(expense.receipt_url);
        receiptUrls = Array.isArray(parsed) ? parsed.join('; ') : expense.receipt_url;
      } catch {
        receiptUrls = expense.receipt_url;
      }
    }
    
    return [
      expense.date,
      expense.driver_name || expense.driver_id || 'N/A',
      expense.expense_vehicle_number || expense.vehicle_number || 'N/A',
      expense.category,
      expense.amount || 0,
      expense.total_revenue || 0,
      expense.uber_revenue || 0,
      expense.rapido_revenue || 0,
      expense.note || '',
      receiptUrls,
      expense.uber_proof_url || '',
      expense.rapido_proof_url || '',
    ];
  });

  // Create worksheet data
  const worksheetData = [headers, ...rows];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 20 }, // Driver
    { wch: 15 }, // Vehicle Number
    { wch: 15 }, // Category
    { wch: 12 }, // Amount
    { wch: 15 }, // Total Revenue
    { wch: 15 }, // Uber Revenue
    { wch: 15 }, // Rapido Revenue
    { wch: 30 }, // Note
    { wch: 40 }, // Receipts
    { wch: 40 }, // Uber Proof
    { wch: 40 }, // Rapido Proof
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return excelBuffer;
}

