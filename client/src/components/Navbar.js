'use client';

/**
 * Navigation Bar Component
 * Displays application branding, navigation links, user status badge,
 * and dynamic login/logout actions based on authentication state.
 */

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-emerald-700 text-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight hover:opacity-90 transition">
            <span className="text-2xl" role="img" aria-label="leaf">🌿</span>
            <span>WasteWise</span>
          </Link>
        </div>

        {/* Navigation links & Auth controls */}
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-emerald-100 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
          >
            Home
          </Link>

          <Link
            href="/partners"
            className="text-emerald-100 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
          >
            Partners
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-emerald-100 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                Dashboard
              </Link>

              {user?.role === 'citizen' && (
                <Link
                  href="/upload"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-md text-sm font-semibold transition flex items-center gap-1 shadow-xs"
                >
                  <span>📷</span> Upload Waste
                </Link>
              )}

              {/* User badge */}
              <div className="flex items-center space-x-2 bg-emerald-800/80 px-3 py-1.5 rounded-full text-xs font-medium">
                <span className="text-emerald-200">{user?.name}</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase text-[10px] tracking-wider font-semibold">
                  {user?.role}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="bg-emerald-800 hover:bg-emerald-900 text-emerald-100 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-emerald-100 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-3.5 py-1.5 rounded-md text-sm font-semibold shadow-sm transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
