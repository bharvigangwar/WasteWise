'use client';

/**
 * Role-Aware Dashboard Component
 * Dynamically provides customized experiences:
 * - Citizen: Live ledger coin balance, transaction ledger, waste uploads with status badges, and active vouchers.
 * - Business: Partner verification status, merchant profile registration, voucher verification & history.
 * - Admin: Platform overview.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();

  // Citizen states
  const [wallet, setWallet] = useState({ balance: 0, valueInRupees: 0, recentTransactions: [] });
  const [contributions, setContributions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [citizenTab, setCitizenTab] = useState('contributions');

  // Business states
  const [businessProfile, setBusinessProfile] = useState(null);
  const [businessRedemptions, setBusinessRedemptions] = useState([]);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherMessage, setVoucherMessage] = useState(null);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);

  // Business registration form state
  const [regFormData, setRegFormData] = useState({
    name: '',
    address: '',
    category: 'Grocery & Essentials',
    description: '',
    discountOffer: 'Accepts Green Coins for instant checkout discounts',
  });
  const [isRegisteringBiz, setIsRegisteringBiz] = useState(false);
  const [regError, setRegError] = useState('');

  const [loadingData, setLoadingData] = useState(true);

  /**
   * Fetches data appropriate to the user's role.
   */
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    try {
      if (user.role === 'citizen') {
        const [walletRes, contribRes, redemptionsRes] = await Promise.allSettled([
          api.get('/wallet'),
          api.get('/contributions/my'),
          api.get('/redemptions/my'),
        ]);

        if (walletRes.status === 'fulfilled' && walletRes.value.data?.success) {
          setWallet(walletRes.value.data.data);
        }
        if (contribRes.status === 'fulfilled' && contribRes.value.data?.success) {
          setContributions(contribRes.value.data.data.contributions || []);
        }
        if (redemptionsRes.status === 'fulfilled' && redemptionsRes.value.data?.success) {
          setRedemptions(redemptionsRes.value.data.data.redemptions || []);
        }
      } else if (user.role === 'business') {
        const [bizRes, redemptionsRes] = await Promise.allSettled([
          api.get('/business/profile'),
          api.get('/redemptions/business'),
        ]);

        if (bizRes.status === 'fulfilled' && bizRes.value.data?.success) {
          setBusinessProfile(bizRes.value.data.data.business);
        }
        if (redemptionsRes.status === 'fulfilled' && redemptionsRes.value.data?.success) {
          setBusinessRedemptions(redemptionsRes.value.data.data.redemptions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Merchant confirms a citizen voucher.
   */
  const handleVerifyVoucher = async (e) => {
    e.preventDefault();
    setVoucherMessage(null);

    if (!voucherCodeInput.trim()) return;

    setIsVerifyingVoucher(true);
    try {
      const res = await api.post('/redemptions/confirm', {
        code: voucherCodeInput.trim(),
      });

      if (res.data?.success) {
        setVoucherMessage({
          type: 'success',
          text: res.data.message || 'Voucher redeemed successfully!',
        });
        setVoucherCodeInput('');
        loadDashboardData(); // Refresh history
      } else {
        setVoucherMessage({
          type: 'error',
          text: res.data.message || 'Could not verify voucher.',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed';
      setVoucherMessage({ type: 'error', text: msg });
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  /**
   * Merchant registers their store profile.
   */
  const handleRegisterBusiness = async (e) => {
    e.preventDefault();
    setRegError('');
    setIsRegisteringBiz(true);

    try {
      const res = await api.post('/business/register', regFormData);
      if (res.data?.success) {
        setBusinessProfile(res.data.data.business);
      } else {
        setRegError(res.data?.message || 'Registration failed');
      }
    } catch (err) {
      setRegError(err.response?.data?.message || err.message || 'Registration error');
    } finally {
      setIsRegisteringBiz(false);
    }
  };

  /**
   * Citizen cancels a pending voucher.
   */
  const handleCancelVoucher = async (redemptionId) => {
    if (!confirm('Cancel this voucher and refund the coins back to your wallet?')) return;

    try {
      const res = await api.post(`/redemptions/${redemptionId}/cancel`);
      if (res.data?.success) {
        loadDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel voucher');
    }
  };

  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-block bg-emerald-600/60 backdrop-blur-sm text-emerald-100 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold mb-2">
                {user?.role} Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                {user?.email}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center sm:min-w-[140px]">
              <span className="block text-xs uppercase tracking-wider text-emerald-200 font-medium">
                Account Status
              </span>
              <span className="text-base font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* ---------------- CITIZEN DASHBOARD ---------------- */}
        {user?.role === 'citizen' && (
          <section className="space-y-8">
            {/* Wallet & Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                    Ledger Coin Balance
                  </span>
                  <div className="text-4xl font-black mt-2 tracking-tight">
                    {wallet.balance} 🪙
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    Equivalent value: <strong className="text-white">₹{wallet.valueInRupees?.toFixed(0)}</strong>
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-emerald-600/50 flex gap-2">
                  <Link
                    href="/partners"
                    className="flex-1 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold py-2 rounded-xl text-center shadow-xs transition"
                  >
                    Redeem Coins →
                  </Link>
                </div>
              </div>

              {/* Submissions Stats */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                    Total Contributions
                  </span>
                  <div className="text-4xl font-black text-gray-900 mt-2 tracking-tight">
                    {contributions.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Approved: {contributions.filter((c) => c.status === 'approved').length} | Review: {contributions.filter((c) => c.status === 'pending_review').length}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <Link
                    href="/upload"
                    className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl text-center shadow-xs transition"
                  >
                    Upload Waste Photo →
                  </Link>
                </div>
              </div>

              {/* Active Vouchers Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                    Active Vouchers
                  </span>
                  <div className="text-4xl font-black text-teal-700 mt-2 tracking-tight">
                    {redemptions.filter((r) => r.status === 'pending').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Spend at participating local businesses
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button
                    onClick={() => setCitizenTab('vouchers')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 rounded-xl transition"
                  >
                    View Voucher Codes
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-4">
                <button
                  onClick={() => setCitizenTab('contributions')}
                  className={`py-3 px-2 border-b-2 text-sm font-bold transition ${
                    citizenTab === 'contributions'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Contributions ({contributions.length})
                </button>
                <button
                  onClick={() => setCitizenTab('ledger')}
                  className={`py-3 px-2 border-b-2 text-sm font-bold transition ${
                    citizenTab === 'ledger'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Ledger Transactions ({wallet.recentTransactions?.length || 0})
                </button>
                <button
                  onClick={() => setCitizenTab('vouchers')}
                  className={`py-3 px-2 border-b-2 text-sm font-bold transition ${
                    citizenTab === 'vouchers'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Redemptions ({redemptions.length})
                </button>
              </nav>
            </div>

            {/* Tab 1: Contributions List */}
            {citizenTab === 'contributions' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-gray-900 text-lg mb-4">
                  Waste Segregation Submissions
                </h3>
                {contributions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-2">📸</div>
                    <p className="text-sm text-gray-600 font-medium">No waste contributions submitted yet.</p>
                    <Link
                      href="/upload"
                      className="mt-3 inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                    >
                      Upload First Photo
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {contributions.map((c) => (
                      <div key={c._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold">
                            {c.declaredCategory === 'wet' ? '🍎' : c.declaredCategory === 'dry' ? '📦' : c.declaredCategory === 'recyclable' ? '♻️' : c.declaredCategory === 'ewaste' ? '🔋' : '⚠️'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 capitalize text-sm">
                              {c.declaredCategory} Waste
                              {c.aiCategory && c.aiCategory !== 'unknown' && (
                                <span className="text-xs text-gray-500 font-normal ml-2">
                                  (AI: {c.aiCategory})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {c.status === 'approved' && (
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                              +{c.coinsAwarded} Coins 🪙
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              c.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'pending_review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {c.status === 'approved' ? '✓ Approved' : c.status === 'pending_review' ? '⏳ Under Review' : '✕ Rejected'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Ledger Transactions */}
            {citizenTab === 'ledger' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-gray-900 text-lg mb-1">
                  Append-Only Ledger History
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Every coin movement is permanently preserved in this tamper-proof transaction log.
                </p>

                {(!wallet.recentTransactions || wallet.recentTransactions.length === 0) ? (
                  <p className="text-xs text-gray-500 text-center py-8">No ledger entries recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {wallet.recentTransactions.map((tx) => (
                          <tr key={tx._id} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 uppercase font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  tx.type === 'earn'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : tx.type === 'redeem'
                                    ? 'bg-blue-100 text-blue-800'
                                    : tx.type === 'refund'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className={`p-3 font-extrabold text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🪙
                            </td>
                            <td className="p-3 text-gray-600">{tx.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Redemptions Vouchers */}
            {citizenTab === 'vouchers' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-gray-900 text-lg mb-4">
                  My Redemption Vouchers
                </h3>

                {redemptions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-3xl mb-2">🏷️</div>
                    <p className="text-sm text-gray-600 font-medium">No vouchers created yet.</p>
                    <Link
                      href="/partners"
                      className="mt-3 inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                    >
                      Explore Partners & Redeem
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {redemptions.map((r) => (
                      <div
                        key={r._id}
                        className={`p-5 rounded-2xl border ${
                          r.status === 'pending'
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : r.status === 'completed'
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-red-100 bg-red-50/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {r.business?.name || 'Partner Merchant'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              r.status === 'pending'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'completed'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>

                        <div className="text-2xl font-black font-mono tracking-wider text-emerald-950 my-2 select-all">
                          {r.code}
                        </div>

                        <div className="text-xs text-gray-600 flex justify-between items-center mt-3 pt-2 border-t border-gray-200/60">
                          <span>
                            Discount: <strong className="text-gray-900">₹{r.valueInRupees}</strong> ({r.coins} coins)
                          </span>
                          {r.status === 'pending' && (
                            <button
                              onClick={() => handleCancelVoucher(r._id)}
                              className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                            >
                              Cancel & Refund
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ---------------- BUSINESS PARTNER DASHBOARD ---------------- */}
        {user?.role === 'business' && (
          <section className="space-y-8">
            {/* If merchant has not yet registered their business */}
            {!businessProfile ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                    🏪
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">
                    Register Your Business Profile
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Join our local network of eco-friendly partners. Once approved by an administrator,
                    citizens can redeem their Green Coins at your store.
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegisterBusiness} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Business or Store Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Green Leaf Cafe or Fresh Organic Mart"
                      value={regFormData.name}
                      onChange={(e) => setRegFormData({ ...regFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Physical Location / Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shop 12, Main Market, Sector 4"
                      value={regFormData.address}
                      onChange={(e) => setRegFormData({ ...regFormData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={regFormData.category}
                      onChange={(e) => setRegFormData({ ...regFormData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Grocery & Essentials">Grocery & Essentials</option>
                      <option value="Cafe & Bakery">Cafe & Bakery</option>
                      <option value="Retail & Fashion">Retail & Fashion</option>
                      <option value="Electronics & Repair">Electronics & Repair</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Discount Offer Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10% off bill or ₹1 discount per Green Coin"
                      value={regFormData.discountOffer}
                      onChange={(e) => setRegFormData({ ...regFormData, discountOffer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Tell citizens about your sustainable products..."
                      value={regFormData.description}
                      onChange={(e) => setRegFormData({ ...regFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRegisteringBiz}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-xs transition"
                  >
                    {isRegisteringBiz ? 'Registering Profile...' : 'Submit Profile for Admin Approval'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Business Partner Status Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-gray-900">{businessProfile.name}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          businessProfile.isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {businessProfile.isApproved ? '✓ Verified Partner' : '⏳ Pending Admin Approval'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {businessProfile.address} • Category: {businessProfile.category}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-400 block uppercase font-bold">Total Customer Visits</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {businessRedemptions.filter((r) => r.status === 'completed').length}
                    </span>
                  </div>
                </div>

                {/* Voucher Redemption Form */}
                {businessProfile.isApproved ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-1">
                      Verify & Redeem Citizen Voucher
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">
                      Enter the 8-character voucher code presented by the citizen (e.g. WW-XXXXXX) to apply discount.
                    </p>

                    {voucherMessage && (
                      <div
                        className={`mb-6 p-4 rounded-xl text-xs font-semibold ${
                          voucherMessage.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}
                      >
                        {voucherMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleVerifyVoucher} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="WW-XXXXXX"
                        required
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono text-lg uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={isVerifyingVoucher || !voucherCodeInput.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-xs transition disabled:opacity-50"
                      >
                        {isVerifyingVoucher ? 'Verifying...' : 'Redeem Voucher'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 text-sm">
                    <h4 className="font-bold text-amber-950 mb-1">Profile Under Admin Review</h4>
                    <p className="text-xs text-amber-800">
                      Your business profile has been submitted and is awaiting administrator approval.
                      Once approved (Day 4), citizens will be able to select your business and redeem Green Coins!
                    </p>
                  </div>
                )}

                {/* Redemptions Log */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-4">
                    Customer Redemption History
                  </h3>

                  {businessRedemptions.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">
                      No customer voucher redemptions yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                          <tr>
                            <th className="p-3">Voucher Code</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Coins</th>
                            <th className="p-3">Discount Value</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {businessRedemptions.map((r) => (
                            <tr key={r._id} className="hover:bg-gray-50">
                              <td className="p-3 font-mono font-bold text-emerald-950">{r.code}</td>
                              <td className="p-3 text-gray-700">{r.user?.name || 'Citizen'}</td>
                              <td className="p-3 font-bold">{r.coins} 🪙</td>
                              <td className="p-3 font-extrabold text-emerald-700">₹{r.valueInRupees}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    r.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* ---------------- ADMIN DASHBOARD ---------------- */}
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
                and configure coin values and daily upload limits.
              </p>
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
