'use client';

import { useState, useEffect } from 'react';
import type { ExpenseFormData, ExpenseCategory } from '@/types';

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ExpenseFormData>;
  loading?: boolean;
  isAdmin?: boolean; // If true, show driver selector and make proofs optional
  drivers?: Array<{ driver_id: string; driver_name: string }>; // For admin driver selection
}

export default function ExpenseForm({ onSubmit, onCancel, initialData, loading, isAdmin = false, drivers = [] }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    category: initialData?.category || 'other',
    amount: initialData?.amount || 0,
    note: initialData?.note || '',
    purpose: initialData?.purpose || '',
    total_revenue: initialData?.total_revenue || 0,
    uber_revenue: initialData?.uber_revenue || 0,
    rapido_revenue: initialData?.rapido_revenue || 0,
    driver_id: initialData?.driver_id || '',
  });

  const [receipts, setReceipts] = useState<File[]>([]);
  const [uberProof, setUberProof] = useState<File | null>(null);
  const [rapidoProof, setRapidoProof] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only auto-calculate total revenue for drivers (not admin)
    if (!isAdmin) {
      const total = Math.round((formData.uber_revenue || 0) + (formData.rapido_revenue || 0));
      setFormData((prev) => ({ ...prev, total_revenue: total }));
    }
  }, [formData.uber_revenue, formData.rapido_revenue, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const amount = formData.amount || 0;
    const totalRevenue = formData.total_revenue || 0;
    const uberRevenue = formData.uber_revenue || 0;
    const rapidoRevenue = formData.rapido_revenue || 0;

    // At least one of revenue or expense must be greater than 0
    const hasRevenue = totalRevenue > 0 || uberRevenue > 0 || rapidoRevenue > 0;
    const hasExpense = amount > 0;
    
    if (!hasRevenue && !hasExpense) {
      setErrors({ general: 'At least one of Revenue or Expense must be greater than 0' });
      return;
    }

    // Admin must have purpose
    if (isAdmin && !formData.purpose) {
      setErrors({ purpose: 'Purpose is required' });
      return;
    }

    const submitData: ExpenseFormData = {
      ...formData,
      receipts: receipts.length > 0 ? receipts : undefined,
      uber_proof: uberProof,
      rapido_proof: rapidoProof,
    };

    await onSubmit(submitData);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReceipts(Array.from(e.target.files));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-800">{errors.general}</div>
        </div>
      )}

      {/* Date Field - At the Top */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-2 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Select Date</h3>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Purpose for Admin */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-6 space-y-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Purpose</h3>
          </div>
          <div>
            <label htmlFor="purpose" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Purpose <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="purpose"
              required={isAdmin}
              value={formData.purpose || ''}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter purpose of expense"
            />
            {errors.purpose && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.purpose}</p>}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-4 border border-green-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Revenue Details</h3>
        </div>
        
        {isAdmin ? (
          /* Admin: Only Total Revenue */
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300 shadow-sm">
            <label htmlFor="total_revenue" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Total Revenue (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-green-700 font-bold text-lg">₹</span>
              </div>
              <input
                type="number"
                id="total_revenue"
                min="0"
                step="1"
                required={isAdmin}
                value={formData.total_revenue || ''}
                onChange={(e) => setFormData({ ...formData, total_revenue: Math.round(parseFloat(e.target.value) || 0) })}
                className="w-full pl-10 rounded-lg border-2 border-green-300 px-3 py-3 text-gray-900 bg-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        ) : (
          /* Driver: Uber + Rapido Revenue with Screenshots */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <label htmlFor="uber_revenue" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Uber Revenue (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">₹</span>
              </div>
              <input
                type="number"
                id="uber_revenue"
                min="0"
                step="1"
                value={formData.uber_revenue || ''}
                onChange={(e) => setFormData({ ...formData, uber_revenue: Math.round(parseFloat(e.target.value) || 0) })}
                className="w-full pl-8 rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <label htmlFor="uber_proof" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Uber Screenshot <span className="text-xs text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="uber_proof"
                accept="image/*"
                onChange={(e) => setUberProof(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              {uberProof && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {uberProof.name}
                </p>
              )}
            </div>
            {errors.uber_proof && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.uber_proof}</p>}
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <label htmlFor="rapido_revenue" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rapido Revenue (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">₹</span>
              </div>
              <input
                type="number"
                id="rapido_revenue"
                min="0"
                step="1"
                value={formData.rapido_revenue || ''}
                onChange={(e) => setFormData({ ...formData, rapido_revenue: Math.round(parseFloat(e.target.value) || 0) })}
                className="w-full pl-8 rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <label htmlFor="rapido_proof" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Rapido Screenshot <span className="text-xs text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="rapido_proof"
                accept="image/*"
                onChange={(e) => setRapidoProof(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              {rapidoProof && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {rapidoProof.name}
                </p>
              )}
            </div>
            {errors.rapido_proof && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.rapido_proof}</p>}
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300 shadow-sm">
            <label htmlFor="total_revenue" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Total Revenue (₹)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-green-700 font-bold text-lg">₹</span>
              </div>
              <input
                type="number"
                id="total_revenue"
                min="0"
                step="1"
                value={formData.total_revenue || ''}
                readOnly
                className="w-full pl-10 rounded-lg border-2 border-green-300 px-3 py-3 text-gray-900 bg-white font-semibold text-lg cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Automatically calculated from Uber + Rapido revenue
            </p>
          </div>
        </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 space-y-4 border border-red-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-2 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Expense Details</h3>
        </div>

        <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg p-4 border-2 border-red-300 shadow-sm">
          <label htmlFor="amount" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Amount (₹)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-red-700 font-bold text-lg">₹</span>
            </div>
              <input
                type="number"
                id="amount"
                min="0"
                step="1"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Math.round(parseFloat(e.target.value) || 0) })}
                className="w-full pl-10 rounded-lg border-2 border-red-300 px-3 py-3 text-gray-900 bg-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0"
              />
          </div>
        </div>

          {!isAdmin && (
            <div>
              <label htmlFor="receipts" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Receipts <span className="text-xs text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                id="receipts"
                accept="image/*"
                multiple
                onChange={handleReceiptChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {receipts.length > 0 && (
                <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {receipts.length} file(s) selected
                </p>
              )}
            </div>
          )}

        <div>
          <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Note
          </label>
          <textarea
            id="note"
            rows={3}
            value={formData.note || ''}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Add any additional notes or details..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Expense
            </>
          )}
        </button>
      </div>
    </form>
  );
}

