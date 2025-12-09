'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, removeToken, getAuthHeaders } from '@/lib/client-auth';
import Header from '@/components/Header';
import type { DriverStats, Vehicle } from '@/types';

export default function DriversPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverStats[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverStats | null>(null);
  const [editingDriver, setEditingDriver] = useState<DriverStats | null>(null);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone_number: '',
    password: '',
    vehicle_id: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    phone_number: '',
    vehicle_id: '',
    password: '',
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

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDriver),
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewDriver({ name: '', phone_number: '', password: '', vehicle_id: '' });
        loadDrivers();
        loadVehicles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create driver');
      }
    } catch (error) {
      console.error('Failed to create driver:', error);
      alert('Failed to create driver. Please try again.');
    }
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const updateData: any = {
        name: editForm.name,
        phone_number: editForm.phone_number,
        vehicle_id: editForm.vehicle_id || null,
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await fetch(`/api/drivers/${editingDriver.driver_id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setEditingDriver(null);
        setEditForm({ name: '', phone_number: '', vehicle_id: '', password: '' });
        loadDrivers();
        loadVehicles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update driver');
      }
    } catch (error) {
      console.error('Failed to update driver:', error);
      alert('Failed to update driver. Please try again.');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        loadDrivers();
        loadVehicles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete driver');
      }
    } catch (error) {
      console.error('Failed to delete driver:', error);
      alert('Failed to delete driver. Please try again.');
    }
  };

  const handleDriverClick = async (driver: DriverStats) => {
    setEditingDriver(driver);
    
    // Find the vehicle ID for this driver's vehicle number
    let vehicleId = '';
    if (driver.driver_vehicle_number) {
      const assignedVehicle = vehicles.find(v => v.vehicle_number === driver.driver_vehicle_number && v.driver_id === driver.driver_id);
      if (assignedVehicle) {
        vehicleId = assignedVehicle.id;
      }
    }
    
    setEditForm({
      name: driver.driver_name,
      phone_number: driver.driver_phone_number,
      vehicle_id: vehicleId,
      password: '',
    });
  };

  const handleLogout = () => {
    removeToken();
    router.replace('/fleet/admin/login');
  };

  const availableVehicles = vehicles.filter(v => v.status === 'available');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalDrivers = drivers.length;
  const assignedDrivers = drivers.filter(d => d.driver_vehicle_number).length;
  const unassignedDrivers = totalDrivers - assignedDrivers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header showNavigation={true} currentPage="drivers" userRole="admin" onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Driver Management
              </h1>
              <p className="text-gray-600 mt-1">Manage fleet drivers and assignments</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Drivers</p>
                  <p className="text-3xl font-bold">{totalDrivers}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Assigned</p>
                  <p className="text-3xl font-bold">{assignedDrivers}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Unassigned</p>
                  <p className="text-3xl font-bold">{unassignedDrivers}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {showAddForm ? (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Driver</h2>
                  <p className="text-gray-600 text-sm mt-1">Create a new driver account</p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddDriver} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newDriver.name}
                    onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newDriver.phone_number}
                    onChange={(e) => setNewDriver({ ...newDriver, phone_number: e.target.value.replace(/[^\d]/g, '') })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newDriver.password}
                    onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vehicle *</label>
                  <select
                    required
                    value={newDriver.vehicle_id}
                    onChange={(e) => setNewDriver({ ...newDriver, vehicle_id: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                  >
                    <option value="">Select Vehicle</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Driver
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Drivers</h2>
                  <p className="text-sm text-gray-600 mt-1">{totalDrivers} total drivers</p>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Driver
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {drivers.map((driver) => (
                      <tr
                        key={driver.driver_id}
                        onClick={() => handleDriverClick(driver)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.driver_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.driver_phone_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.driver_vehicle_number || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDriver(driver.driver_id);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {editingDriver && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 transform transition-all duration-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Driver</h2>
                    <p className="text-gray-600 text-sm mt-1">Update driver information</p>
                  </div>
                  <button
                    onClick={() => setEditingDriver(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleUpdateDriver} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value.replace(/[^\d]/g, '') })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Vehicle</label>
                    <select
                      value={editForm.vehicle_id}
                      onChange={(e) => setEditForm({ ...editForm, vehicle_id: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    >
                      <option value="">No Vehicle (Unassign)</option>
                      {vehicles.filter(v => v.status === 'available' || v.driver_id === editingDriver?.driver_id).map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} {vehicle.driver_id === editingDriver?.driver_id ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingDriver(null)}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Driver
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
