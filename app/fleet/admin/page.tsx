'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, removeToken, getAuthHeaders } from '@/lib/client-auth';
import ExpenseTable from '@/components/ExpenseTable';
import Pagination from '@/components/Pagination';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import Header from '@/components/Header';
import type { Expense, ExpenseFilters, DriverStats, Vehicle } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [drivers, setDrivers] = useState<DriverStats[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalRevenue: 0,
    netProfit: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    assignedVehicles: 0,
  });
  const [filters, setFilters] = useState<ExpenseFilters>({
    driver_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    category: undefined,
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
      const token = getToken();
      if (!token) {
      router.replace('/fleet/admin/login');
        return;
      }
    setLoading(false);
    loadDrivers();
    loadVehicles();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      loadExpenses();
    }
  }, [filters, loading]);

  useEffect(() => {
    if (!loading) {
      loadStats();
    }
  }, [filters.start_date, filters.end_date, loading]);

  const loadStats = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const [analyticsRes, driversRes, vehiclesRes] = await Promise.all([
        fetch(`/api/analytics?${params}`, { headers }),
        fetch('/api/drivers', { headers }),
        fetch('/api/vehicles', { headers }),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setStats((prev) => ({
          ...prev,
          totalExpenses: analyticsData.totalExpenses || 0,
          totalRevenue: analyticsData.totalRevenue || 0,
          netProfit: (analyticsData.totalRevenue || 0) - (analyticsData.totalExpenses || 0),
        }));
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setStats((prev) => ({
          ...prev,
          totalDrivers: driversData.data?.length || 0,
        }));
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        const assigned = vehiclesData.data?.filter((v: Vehicle) => v.status === 'assigned').length || 0;
        setStats((prev) => ({
          ...prev,
          totalVehicles: vehiclesData.data?.length || 0,
          assignedVehicles: assigned,
        }));
        }
      } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/drivers', { headers });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/vehicles', { headers });
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const params = new URLSearchParams();
      if (filters.driver_id) params.append('driver_id', filters.driver_id);
      if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.category) params.append('category', filters.category);
      params.append('page', String(filters.page || 1));
      params.append('limit', String(filters.limit || 20));

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

  const handleExportCSV = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const params = new URLSearchParams();
      if (filters.driver_id) params.append('driver_id', filters.driver_id);
      if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.category) params.append('category', filters.category);

      const response = await fetch(`/api/expenses/export?${params}`, { headers });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const handleFilterChange = (key: keyof ExpenseFilters, value: string | undefined) => {
    setFilters((prev) => {
      const newFilters: ExpenseFilters = { ...prev, page: 1 };
      
      if (key === 'category') {
        newFilters.category = (value as any) || undefined;
      } else if (key === 'vehicle_id') {
        newFilters.vehicle_id = value || '';
        if (value) {
          newFilters.driver_id = '';
        }
      } else if (key === 'driver_id') {
        newFilters.driver_id = value || '';
        if (value) {
          newFilters.vehicle_id = '';
        }
      } else {
        (newFilters as any)[key] = value || '';
      }
      
      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      driver_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      category: undefined,
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLogout = () => {
    removeToken();
    router.replace('/fleet/admin/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const assignedVehicles = vehicles.filter(v => v.status === 'assigned' && v.driver_id);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header showNavigation={true} currentPage="expenses" userRole="admin" onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Dashboard Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Fleet Management & Analytics</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
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
                  <p className="text-3xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
                  </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${stats.netProfit >= 0 ? 'text-green-100' : 'text-orange-100'} text-sm font-medium mb-1`}>Net Profit</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.netProfit)}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                  </div>
                  </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                  <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Drivers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
                  </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                  <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Vehicles</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalVehicles}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.assignedVehicles} assigned</p>
                </div>
                <div className="bg-purple-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
                  </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                  <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Records found</p>
                  </div>
                <div className="bg-indigo-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                <p className="text-gray-600 text-sm mt-1">Expenses & Revenue Overview</p>
              </div>
            </div>
            <AnalyticsCharts filters={filters} />
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                <select
                  value={filters.driver_id || ''}
                  onChange={(e) => handleFilterChange('driver_id', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white text-sm"
                >
                  <option value="">All Drivers</option>
                  {drivers.map((driver) => (
                    <option key={driver.driver_id} value={driver.driver_id}>
                      {driver.driver_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <select
                  value={filters.vehicle_id || ''}
                  onChange={(e) => handleFilterChange('vehicle_id', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white text-sm"
                >
                  <option value="">All Vehicles</option>
                  {assignedVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="fuel">Fuel</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="toll">Toll</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
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

          {/* Expenses Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
                <p className="text-sm text-gray-600 mt-1">{pagination.total} total records</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
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
        </div>
      </div>
    </div>
  );
}
