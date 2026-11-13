'use client';

/**
 * Role-Aware Dashboard Shell Component
 * Protected by ProtectedRoute. Renders tailored viewports for Citizens, Businesses, and Admins.
 */

import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-md mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-block bg-emerald-600/60 backdrop-blur-sm text-emerald-100 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-2">
                {user?.role} Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-emerald-100 text-sm mt-1">
                {user?.email}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center sm:min-w-[140px]">
              <span className="block text-xs uppercase tracking-wider text-emerald-200 font-medium">
                Status
              </span>
              <span className="text-lg font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Role-Specific Viewports */}
        {user?.role === 'citizen' && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Citizen Overview</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Green Coins Balance</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">0 🪙</div>
                <p className="text-xs text-gray-400 mt-2">Live ledger balance (Day 3)</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Approved Contributions</div>
                <div className="text-3xl font-extrabold text-gray-900 mt-2">0</div>
                <p className="text-xs text-gray-400 mt-2">Verified waste uploads (Day 2)</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Daily Upload Quota</div>
                <div className="text-3xl font-extrabold text-teal-600 mt-2">5 / 5 left</div>
                <p className="text-xs text-gray-400 mt-2">Resets every 24 hours</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-emerald-900">
              <h3 className="font-semibold text-lg text-emerald-950 mb-1">
                Next Steps for Citizens (Day 2)
              </h3>
              <p className="text-sm text-emerald-800">
                You will be able to upload household segregated waste photos (Wet, Dry, Recyclable, E-waste, Hazardous)
                for instant AI classification by Google Gemini and earn Green Coins.
              </p>
            </div>
          </section>
        )}

        {user?.role === 'business' && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Business Partner Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Coins Redeemed</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">0 🪙</div>
                <p className="text-xs text-gray-400 mt-2">Redemption records (Day 3)</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Customers Served</div>
                <div className="text-3xl font-extrabold text-gray-900 mt-2">0</div>
                <p className="text-xs text-gray-400 mt-2">Total citizen visits</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Partner Listing</div>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">Pending</div>
                <p className="text-xs text-gray-400 mt-2">Approval workflow (Day 3)</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-900">
              <h3 className="font-semibold text-lg text-blue-950 mb-1">
                Partner Redemption System (Day 3)
              </h3>
              <p className="text-sm text-blue-800">
                You will be able to verify citizen redemption codes, redeem Green Coins for product discounts,
                and maintain your business profile.
              </p>
            </div>
          </section>
        )}

        {user?.role === 'admin' && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Administrator Console</h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Pending Reviews</div>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">0</div>
                <p className="text-xs text-gray-400 mt-2">Low-confidence uploads (Day 4)</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Partner Approvals</div>
                <div className="text-3xl font-extrabold text-blue-600 mt-2">0</div>
                <p className="text-xs text-gray-400 mt-2">New business requests (Day 4)</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Coins Issued</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">0 🪙</div>
                <p className="text-xs text-gray-400 mt-2">Ledger total</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-500">Program Rules</div>
                <div className="text-3xl font-extrabold text-purple-600 mt-2">Active</div>
                <p className="text-xs text-gray-400 mt-2">Rule configuration (Day 4)</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-purple-900">
              <h3 className="font-semibold text-lg text-purple-950 mb-1">
                Admin Controls (Day 4)
              </h3>
              <p className="text-sm text-purple-800">
                You will be able to review borderline AI classifications, approve or reject partner businesses,
                configure coin values and daily upload limits.
              </p>
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
