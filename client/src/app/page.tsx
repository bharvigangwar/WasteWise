'use client';

/**
 * WasteWise Home / Landing Page
 * Introduces the platform concept, benefits, categories, and direct routes
 * to register as a citizen or business partner.
 */

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-700 via-emerald-600 to-teal-700 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-200 uppercase tracking-wider">
            <span>🌱</span> Clean Cities • Smart Rewards
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Turn Household Waste into <span className="text-emerald-200">Green Coins</span>
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto font-normal">
            Segregate your daily household waste, snap a photo, let AI verify it, and earn Green Coins
            redeemable for discounts at participating neighborhood businesses.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-3.5 rounded-xl font-bold shadow-md transition"
              >
                Go to Dashboard ({user?.role}) →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-3.5 rounded-xl font-bold shadow-md transition"
                >
                  Join as Citizen
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto bg-emerald-800/80 hover:bg-emerald-900 text-white px-8 py-3.5 rounded-xl font-semibold border border-emerald-400/30 transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            How WasteWise Works
          </h2>
          <p className="mt-2 text-gray-600 text-sm">
            Three simple steps to make segregation a rewarding everyday habit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Segregate & Snap</h3>
            <p className="text-sm text-gray-600">
              Sort your household waste into Wet, Dry, Recyclable, E-waste, or Hazardous. Snap a quick photo with your phone.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">AI Verification</h3>
            <p className="text-sm text-gray-600">
              Google Gemini Vision evaluates the photo in seconds, checks segregation accuracy, and validates your contribution.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Earn & Redeem</h3>
            <p className="text-sm text-gray-600">
              Earn Green Coins deposited into your tamper-proof ledger. Spend them at verified partner stores and local cafés.
            </p>
          </div>
        </div>
      </section>

      {/* Waste Categories Grid */}
      <section className="bg-slate-100/70 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 text-center mb-6">
            Supported Waste Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/60">
              <span className="text-2xl block mb-1">🍎</span>
              <span className="font-semibold text-sm text-gray-800 block">Wet Waste</span>
              <span className="text-[11px] text-gray-500">Food scraps, peels</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/60">
              <span className="text-2xl block mb-1">📦</span>
              <span className="font-semibold text-sm text-gray-800 block">Dry Waste</span>
              <span className="text-[11px] text-gray-500">Paper, cardboard</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/60">
              <span className="text-2xl block mb-1">♻️</span>
              <span className="font-semibold text-sm text-gray-800 block">Recyclable</span>
              <span className="text-[11px] text-gray-500">Plastics, cans, glass</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/60">
              <span className="text-2xl block mb-1">🔋</span>
              <span className="font-semibold text-sm text-gray-800 block">E-Waste</span>
              <span className="text-[11px] text-gray-500">Batteries, cables</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200/60 col-span-2 sm:col-span-1">
              <span className="text-2xl block mb-1">⚠️</span>
              <span className="font-semibold text-sm text-gray-800 block">Hazardous</span>
              <span className="text-[11px] text-gray-500">Chemicals, paint</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-500">
        <p>© 2026 WasteWise. Empowering communities for cleaner neighborhoods.</p>
      </footer>
    </div>
  );
}
