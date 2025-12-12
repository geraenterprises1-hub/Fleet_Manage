'use client';

import { useState } from 'react';
import type { Expense, ExpenseFormData } from '@/types';
import ExpenseForm from './ExpenseForm';

interface ExpenseTableProps {
  expenses: Expense[];
  onExpenseClick?: (expense: Expense) => void;
  onExpenseUpdate?: () => void; // Callback to refresh expenses after update/delete
  isAdmin?: boolean; // Whether user is admin (can edit/delete)
}

export default function ExpenseTable({ expenses, onExpenseClick, onExpenseUpdate, isAdmin = false }: ExpenseTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const handleRowClick = (expense: Expense, e?: React.MouseEvent) => {
    // Don't open details modal if clicking on action buttons
    if ((e?.target as HTMLElement)?.closest('.action-button')) {
      return;
    }
    setSelectedExpense(expense);
    if (onExpenseClick) {
      onExpenseClick(expense);
    }
  };

  const handleEdit = (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    setEditingExpense(expense);
    setSelectedExpense(null);
  };

  const handleDelete = async (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete this expense from ${formatDate(expense.date)}?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('fleet_auth_token');
      if (!token) {
        alert('Authentication error. Please log in again.');
        return;
      }

      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (onExpenseUpdate) {
          onExpenseUpdate();
        }
        setDeletingExpense(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete expense');
      }
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateExpense = async (formData: ExpenseFormData) => {
    if (!editingExpense) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('fleet_auth_token');
      if (!token) {
        alert('Authentication error. Please log in again.');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('category', formData.category || 'other');
      formDataToSend.append('amount', String(formData.amount || 0));
      if (formData.note) formDataToSend.append('note', formData.note);
      if (formData.purpose) formDataToSend.append('purpose', formData.purpose);
      
      const totalRevenue = formData.total_revenue || 0;
      const uberRevenue = formData.uber_revenue || 0;
      const rapidoRevenue = formData.rapido_revenue || 0;
      
      formDataToSend.append('total_revenue', String(totalRevenue));
      formDataToSend.append('uber_revenue', String(uberRevenue));
      formDataToSend.append('rapido_revenue', String(rapidoRevenue));
      
      if (formData.receipts) {
        formData.receipts.forEach((file: File) => {
          formDataToSend.append('receipts', file);
        });
      }
      
      if (formData.uber_proof) {
        formDataToSend.append('uber_proof', formData.uber_proof);
      }
      
      if (formData.rapido_proof) {
        formDataToSend.append('rapido_proof', formData.rapido_proof);
      }

      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const responseData = await response.json();

      if (response.ok) {
        setEditingExpense(null);
        if (onExpenseUpdate) {
          onExpenseUpdate();
        }
      } else {
        const errorMessage = responseData.error || `Failed to update expense (${response.status})`;
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to update expense:', error);
      alert('Failed to update expense. Please try again.');
    } finally {
      setIsUpdating(false);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fuel':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'toll':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Date
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Driver
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Expense
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Total Revenue
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Uber Revenue
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Rapido Revenue
                </div>
              </th>
              {isAdmin && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    Actions
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => {
              const receiptUrls = parseReceiptUrls(expense.receipt_url || null);
              const hasReceipts = receiptUrls.length > 0;
              const totalExpense = (expense.amount || 0);

              return (
                <tr
                  key={expense.id}
                  onClick={(e) => handleRowClick(expense, e)}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-blue-500"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-100 rounded-lg p-1.5">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatDate(expense.date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-100 rounded-full p-1.5">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{expense.driver_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(totalExpense)}</span>
                      {hasReceipts && (
                        <div className="bg-green-100 rounded-full p-1" title="Has receipts">
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(expense.total_revenue || 0)}</span>
                      {(expense.uber_proof_url || expense.rapido_proof_url) && (
                        <div className="bg-green-100 rounded-full p-1" title="Revenue proof available">
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(expense.uber_revenue || 0)}</span>
                      {expense.uber_proof_url && (
                        <div className="bg-blue-100 rounded-full p-1" title="Uber proof available">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(expense.rapido_revenue || 0)}</span>
                      {expense.rapido_proof_url && (
                        <div className="bg-orange-100 rounded-full p-1" title="Rapido proof available">
                          <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 action-button">
                        <button
                          onClick={(e) => handleEdit(e, expense)}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-md p-1.5 transition-colors duration-200 action-button"
                          title="Edit expense"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, expense)}
                          disabled={isDeleting}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-md p-1.5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed action-button"
                          title="Delete expense"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Expense Details</h2>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Basic Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-indigo-500 rounded-lg p-1.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <label className="text-xs font-semibold text-indigo-700 uppercase">Date</label>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatDate(selectedExpense.date)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-500 rounded-lg p-1.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <label className="text-xs font-semibold text-purple-700 uppercase">Driver</label>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{selectedExpense.driver_name || 'Unknown'}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500 rounded-lg p-1.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <label className="text-xs font-semibold text-blue-700 uppercase">Category</label>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getCategoryColor(selectedExpense.category)}`}>
                    {selectedExpense.category.charAt(0).toUpperCase() + selectedExpense.category.slice(1)}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-red-500 rounded-lg p-1.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <label className="text-xs font-semibold text-red-700 uppercase">Amount</label>
                  </div>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(selectedExpense.amount || 0)}</p>
                </div>
              </div>

              {/* Revenue Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Revenue Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Total Revenue</label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedExpense.total_revenue || 0)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block flex items-center gap-2">
                      <span>Uber Revenue</span>
                      {selectedExpense.uber_proof_url && (
                        <div className="bg-blue-100 rounded-full p-0.5" title="Proof available">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </label>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedExpense.uber_revenue || 0)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block flex items-center gap-2">
                      <span>Rapido Revenue</span>
                      {selectedExpense.rapido_proof_url && (
                        <div className="bg-orange-100 rounded-full p-0.5" title="Proof available">
                          <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </label>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedExpense.rapido_revenue || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Note Section */}
              {selectedExpense.note && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <label className="text-sm font-semibold text-gray-700">Note</label>
                  </div>
                  <p className="text-gray-800">{selectedExpense.note}</p>
                </div>
              )}

              {/* Receipts and Proofs */}
              <div className="space-y-6">
                {parseReceiptUrls(selectedExpense.receipt_url || null).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Expense Receipts</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {parseReceiptUrls(selectedExpense.receipt_url || null).map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 group-hover:border-green-500 transition-all duration-200 shadow-md group-hover:shadow-lg">
                            <img src={url} alt={`Receipt ${idx + 1}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExpense.uber_proof_url && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Uber Revenue Proof</h3>
                    </div>
                    <a
                      href={selectedExpense.uber_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative overflow-hidden rounded-lg border-2 border-blue-200 group-hover:border-blue-500 transition-all duration-200 shadow-md group-hover:shadow-lg">
                        <img src={selectedExpense.uber_proof_url} alt="Uber proof" className="w-full h-auto max-h-96 object-contain group-hover:scale-105 transition-transform duration-200" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                )}

                {selectedExpense.rapido_proof_url && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2 shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Rapido Revenue Proof</h3>
                    </div>
                    <a
                      href={selectedExpense.rapido_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative overflow-hidden rounded-lg border-2 border-orange-200 group-hover:border-orange-500 transition-all duration-200 shadow-md group-hover:shadow-lg">
                        <img src={selectedExpense.rapido_proof_url} alt="Rapido proof" className="w-full h-auto max-h-96 object-contain group-hover:scale-105 transition-transform duration-200" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Edit Expense</h2>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ExpenseForm
                onSubmit={handleUpdateExpense}
                onCancel={() => setEditingExpense(null)}
                initialData={{
                  date: editingExpense.date,
                  category: editingExpense.category,
                  amount: editingExpense.amount,
                  note: editingExpense.note,
                  purpose: (editingExpense as any).purpose || '',
                  total_revenue: editingExpense.total_revenue,
                  uber_revenue: editingExpense.uber_revenue,
                  rapido_revenue: editingExpense.rapido_revenue,
                  driver_id: editingExpense.driver_id || '',
                }}
                isAdmin={isAdmin}
                loading={isUpdating}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

