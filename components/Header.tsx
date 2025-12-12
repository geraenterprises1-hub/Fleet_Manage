'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HeaderProps {
  showNavigation?: boolean;
  currentPage?: 'expenses' | 'drivers' | 'vehicles';
  userRole?: 'admin' | 'driver';
  onLogout?: () => void;
  onAddExpense?: () => void; // For admin to add expenses
}

export default function Header({ showNavigation = false, currentPage, userRole, onLogout, onAddExpense }: HeaderProps) {
  const [showFallback, setShowFallback] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Company Name */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Logo Container */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                {!showFallback ? (
                  <Image
                    src="/logo.png"
                    alt="Gera Enterprises Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                    onError={() => setShowFallback(true)}
                    onLoad={(e) => {
                      // Check if image actually loaded
                      const img = e.target as HTMLImageElement;
                      if (img.naturalHeight === 0) {
                        setShowFallback(true);
                      }
                    }}
                  />
                ) : (
                  /* Fallback logo design - 3D intertwined G and E */
                  <div className="relative w-full h-full">
                    {/* G Letter (Dark Forest Green) - Behind */}
                    <div className="absolute left-1 top-1 w-8 h-11 bg-gradient-to-br from-green-800 via-green-700 to-green-900 rounded-lg shadow-xl transform rotate-[-3deg] flex items-center justify-center border-2 border-green-900/30" style={{ 
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                      zIndex: 1
                    }}>
                      <span className="text-white font-extrabold text-2xl" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>G</span>
                    </div>
                    {/* E Letter (Metallic Gold) - Front */}
                    <div className="absolute right-0 top-0 w-8 h-11 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 rounded-lg shadow-xl transform rotate-[3deg] flex items-center justify-center border-2 border-yellow-400/40" style={{ 
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                      zIndex: 2
                    }}>
                      <span className="text-white font-extrabold text-2xl" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>E</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Company Name */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-green-800" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Gera</span>
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Enterprises</span>
                </div>
                <p className="text-xs text-gray-600 font-semibold mt-0.5">Fleet Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation and Logout */}
          <div className="hidden md:flex items-center gap-2">
            {showNavigation && userRole === 'admin' && (
              <nav className="flex items-center gap-2">
                <Link
                  href="/fleet/admin"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === 'expenses'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Expenses
                </Link>
                <Link
                  href="/fleet/admin/drivers"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === 'drivers'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Drivers
                </Link>
                <Link
                  href="/fleet/admin/vehicles"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === 'vehicles'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Vehicles
                </Link>
                {onAddExpense && (
                  <button
                    onClick={onAddExpense}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Expense
                  </button>
                )}
              </nav>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

