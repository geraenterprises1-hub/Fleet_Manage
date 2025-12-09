'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
  filters: {
    driver_id?: string;
    vehicle_id?: string;
    start_date?: string;
    end_date?: string;
    category?: string;
  };
}

export default function AnalyticsCharts({ filters }: AnalyticsChartsProps) {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const token = localStorage.getItem('fleet_auth_token');
      if (!token) return;

      const response = await fetch(`/api/analytics?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const formattedData = (result.byDate || []).map((item: any) => ({
          date: item.date,
          expenses: item.expenses || 0,
          revenue: item.revenue || 0,
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Expenses & Revenue</h3>
        <div className="flex space-x-2">
          {['daily', 'weekly', 'monthly'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter as any)}
              className={`px-3 py-1 rounded text-sm ${
                timeFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

