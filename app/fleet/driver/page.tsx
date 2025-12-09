'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken, getAuthHeaders } from '@/lib/client-auth';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseTable from '@/components/ExpenseTable';
import Pagination from '@/components/Pagination';
import Header from '@/components/Header';
import type { Expense, ExpenseFormData } from '@/types';

export default function DriverDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/fleet/driver/login');
      return;
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!loading) {
      loadExpenses();
    }
  }, [filters, loading]);

  const loadExpenses = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      params.append('page', String(filters.page));
      params.append('limit', String(filters.limit));

      const response = await fetch(`/api/expenses?${params}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          limit: data.limit || 20,
          totalPages: data.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const handleSubmitExpense = async (formData: ExpenseFormData) => {
    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('amount', String(formData.amount || 0));
      if (formData.note) formDataToSend.append('note', formData.note);
      
      // Always send revenue values (even if 0) to ensure validation works
      const totalRevenue = formData.total_revenue || 0;
      const uberRevenue = formData.uber_revenue || 0;
      const rapidoRevenue = formData.rapido_revenue || 0;
      
      formDataToSend.append('total_revenue', String(totalRevenue));
      formDataToSend.append('uber_revenue', String(uberRevenue));
      formDataToSend.append('rapido_revenue', String(rapidoRevenue));
      
      if (formData.receipts) {
        formData.receipts.forEach((file) => {
          formDataToSend.append('receipts', file);
        });
      }
      
      if (formData.uber_proof) {
        formDataToSend.append('uber_proof', formData.uber_proof);
      }
      
      if (formData.rapido_proof) {
        formDataToSend.append('rapido_proof', formData.rapido_proof);
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          Authorization: headers.Authorization,
        },
        body: formDataToSend,
      });

      const responseData = await response.json();

      if (response.ok) {
        setShowForm(false);
        loadExpenses();
      } else {
        console.error('API Error:', responseData);
        const errorMessage = responseData.error || `Failed to create expense (${response.status})`;
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to submit expense:', error);
      const errorMessage = error?.message || 'Failed to submit expense. Please check your connection and try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLogout = () => {
    removeToken();
    router.replace('/fleet/driver/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = expenses.reduce((sum, e) => sum + (e.total_revenue || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header userRole="driver" onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Dashboard Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Driver Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Track your expenses and revenue</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${totalRevenue - totalAmount >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${totalRevenue - totalAmount >= 0 ? 'text-blue-100' : 'text-orange-100'} text-sm font-medium mb-1`}>Net Profit</p>
                  <p className="text-3xl font-bold">₹{(totalRevenue - totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {!showForm ? (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Expense Management</h2>
                    <p className="text-gray-600 text-sm mt-1">Add and track your daily expenses</p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Expense
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setFilters({ start_date: '', end_date: '', page: 1, limit: 20 })}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 border border-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">My Expenses</h2>
                  <p className="text-sm text-gray-600 mt-1">{pagination.total} total records</p>
                </div>
                <div className="p-6">
                  {expenses.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No expenses found</p>
                  ) : (
                    <>
                      <ExpenseTable expenses={expenses} />
                      <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Expense</h2>
                  <p className="text-gray-600 text-sm mt-1">Record your daily expenses and revenue</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ExpenseForm
                onSubmit={handleSubmitExpense}
                onCancel={() => setShowForm(false)}
                loading={submitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
