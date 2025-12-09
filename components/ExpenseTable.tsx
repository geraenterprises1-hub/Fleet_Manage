'use client';

import { useState } from 'react';
import type { Expense } from '@/types';

interface ExpenseTableProps {
  expenses: Expense[];
  onExpenseClick?: (expense: Expense) => void;
}

export default function ExpenseTable({ expenses, onExpenseClick }: ExpenseTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    if (onExpenseClick) {
      onExpenseClick(expense);
    }
  };

  const parseReceiptUrls = (receiptUrl: string | null): string[] => {
    if (!receiptUrl) return [];
    try {
      const parsed = JSON.parse(receiptUrl);
      return Array.isArray(parsed) ? parsed : [receiptUrl];
    } catch {
      return [receiptUrl];
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expense
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uber Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rapido Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => {
              const receiptUrls = parseReceiptUrls(expense.receipt_url || null);
              const hasReceipts = receiptUrls.length > 0;
              const totalExpense = (expense.amount || 0);

              return (
                <tr
                  key={expense.id}
                  onClick={() => handleRowClick(expense)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.driver_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>{formatCurrency(totalExpense)}</span>
                      {hasReceipts && (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(expense.total_revenue || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>{formatCurrency(expense.uber_revenue || 0)}</span>
                      {expense.uber_proof_url && (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>{formatCurrency(expense.rapido_revenue || 0)}</span>
                      {expense.rapido_proof_url && (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Expense Details</h2>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-lg">{formatDate(selectedExpense.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Driver</label>
                  <p className="text-lg">{selectedExpense.driver_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-lg capitalize">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg">{formatCurrency(selectedExpense.amount || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Revenue</label>
                  <p className="text-lg">{formatCurrency(selectedExpense.total_revenue || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uber Revenue</label>
                  <p className="text-lg">{formatCurrency(selectedExpense.uber_revenue || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rapido Revenue</label>
                  <p className="text-lg">{formatCurrency(selectedExpense.rapido_revenue || 0)}</p>
                </div>
                {selectedExpense.note && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Note</label>
                    <p className="text-lg">{selectedExpense.note}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Expense Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {parseReceiptUrls(selectedExpense.receipt_url || null).map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={url} alt={`Receipt ${idx + 1}`} className="w-full h-auto rounded border" />
                      </a>
                    ))}
                  </div>
                </div>

                {selectedExpense.uber_proof_url && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Uber</h3>
                    <a
                      href={selectedExpense.uber_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img src={selectedExpense.uber_proof_url} alt="Uber proof" className="w-full max-w-md h-auto rounded border" />
                    </a>
                  </div>
                )}

                {selectedExpense.rapido_proof_url && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Rapido</h3>
                    <a
                      href={selectedExpense.rapido_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img src={selectedExpense.rapido_proof_url} alt="Rapido proof" className="w-full max-w-md h-auto rounded border" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

