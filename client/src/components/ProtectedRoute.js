'use client';

/**
 * Protected Route Wrapper Component
 * Restricts view access to authenticated users and optionally checks role permissions.
 * Redirects unauthenticated users to the /login page.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Once loading completes, check if user is authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Show clean loading state while authentication status is being checked
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, render nothing while redirect is happening
  if (!isAuthenticated) {
    return null;
  }

  // If specific roles are required, verify that current user has permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
        <p className="text-red-600 text-sm mb-4">
          Your account role ({user?.role}) does not have permission to access this page.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
}
