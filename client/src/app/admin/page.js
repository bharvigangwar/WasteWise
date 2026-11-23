'use client';

/**
 * WasteWise Administrator Portal
 * Allows administrators to monitor platform metrics, manually review borderline
 * AI waste submissions, approve or suspend partner businesses, and configure
 * Green Coin program rules.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // 1. Stats State
  const [stats, setStats] = useState({
    users: { total: 0, citizens: 0, businesses: 0 },
    contributions: { total: 0, approved: 0, pendingReview: 0, rejected: 0 },
    businesses: { total: 0, pendingApproval: 0, approved: 0 },
    coins: { issued: 0, redeemed: 0, circulating: 0 },
  });

  // 2. Contributions Review State
  const [contributions, setContributions] = useState([]);
  const [contributionFilter, setContributionFilter] = useState('pending_review');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  // 3. Businesses Management State
  const [businesses, setBusinesses] = useState([]);
  const [businessFilter, setBusinessFilter] = useState('all');

  // 4. Program Rules State
  const [rules, setRules] = useState({
    coinsPerCategory: { wet: 10, dry: 10, recyclable: 15, ewaste: 25, hazardous: 20 },
    confidenceThreshold: 0.75,
    dailyContributionLimit: 5,
    minRedeemCoins: 20,
    maxRedeemCoinsPerTransaction: 500,
    coinValueInRupees: 1.0,
  });
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Load platform statistics
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  }, []);

  // Load contributions for review
  const fetchContributions = useCallback(async (status) => {
    try {
      const res = await api.get(`/admin/contributions?status=${status}`);
      if (res.data?.success) {
        setContributions(res.data.data.contributions || []);
      }
    } catch (err) {
      console.error('Error fetching contributions:', err);
    }
  }, []);

  // Load partner businesses
  const fetchBusinesses = useCallback(async (filter) => {
    try {
      const query = filter === 'all' ? '' : `?isApproved=${filter === 'approved'}`;
      const res = await api.get(`/admin/businesses${query}`);
      if (res.data?.success) {
        setBusinesses(res.data.data.businesses || []);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  }, []);

  // Load program rules
  const fetchRules = useCallback(async () => {
    try {
      const res = await api.get('/admin/rules');
      if (res.data?.success && res.data.data?.rules) {
        const raw = res.data.data.rules;
        setRules({
          coinsPerCategory: raw.coinsPerCategory || { wet: 10, dry: 10, recyclable: 15, ewaste: 25, hazardous: 20 },
          confidenceThreshold: raw.confidenceThreshold ?? 0.75,
          dailyContributionLimit: raw.dailyContributionLimit ?? 5,
          minRedeemCoins: raw.minRedeemCoins ?? 20,
          maxRedeemCoinsPerTransaction: raw.maxRedeemCoinsPerTransaction ?? 500,
          coinValueInRupees: raw.coinValueInRupees ?? 1.0,
        });
      }
    } catch (err) {
      console.error('Error fetching program rules:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchContributions('pending_review'),
        fetchBusinesses('all'),
        fetchRules(),
      ]);
      setLoading(false);
    };
    initData();
  }, [fetchStats, fetchContributions, fetchBusinesses, fetchRules]);

  // Handle Review Action (Approve / Reject)
  const handleReview = async (id, action) => {
    try {
      const res = await api.put(`/admin/contributions/${id}/review`, {
        action,
        reviewNote: reviewNote || undefined,
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: res.data.message || `Contribution ${action}d successfully!`,
        });
        setReviewingId(null);
        setReviewNote('');
        fetchContributions(contributionFilter);
        fetchStats();
      } else {
        setFeedback({ type: 'error', text: res.data.message || 'Action failed.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Review failed',
      });
    }
  };

  // Handle Business Approval Toggle
  const handleToggleBusinessApproval = async (id, isApproved) => {
    try {
      const res = await api.put(`/admin/businesses/${id}/status`, { isApproved });
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: res.data.message || 'Business status updated.',
        });
        fetchBusinesses(businessFilter);
        fetchStats();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Update failed',
      });
    }
  };

  // Handle Save Program Rules
  const handleSaveRules = async (e) => {
    e.preventDefault();
    setIsSavingRules(true);
    setFeedback(null);

    try {
      const res = await api.put('/admin/rules', rules);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: 'Program rules saved and updated successfully!',
        });
      } else {
        setFeedback({ type: 'error', text: res.data.message || 'Save failed.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Could not save rules',
      });
    } finally {
      setIsSavingRules(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-800/60 backdrop-blur-sm px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-200 mb-2">
                <span>🛡️</span> Administrator Operations
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                WasteWise Admin Console
              </h1>
              <p className="text-purple-200 text-xs sm:text-sm mt-1">
                Oversee waste verification reviews, approve local partner businesses, and tune the Green Coins economy.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition text-center whitespace-nowrap"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            📊 Platform Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('contributions');
              fetchContributions(contributionFilter);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'contributions'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>📸 Review Submissions</span>
            {stats.contributions.pendingReview > 0 && (
              <span className="bg-amber-400 text-purple-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {stats.contributions.pendingReview}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('businesses');
              fetchBusinesses(businessFilter);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'businesses'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>🏪 Partner Approvals</span>
            {stats.businesses.pendingApproval > 0 && (
              <span className="bg-blue-400 text-purple-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {stats.businesses.pendingApproval}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('rules');
              fetchRules();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'rules'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ⚙️ Program Rules
          </button>
        </div>

        {/* ---------------- 1. OVERVIEW TAB ---------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Total Users
                </span>
                <div className="text-3xl font-black text-gray-900 mt-2">
                  {stats.users.total}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Citizens: <strong>{stats.users.citizens}</strong> • Businesses: <strong>{stats.users.businesses}</strong>
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Contributions
                </span>
                <div className="text-3xl font-black text-emerald-700 mt-2">
                  {stats.contributions.total}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Approved: <strong>{stats.contributions.approved}</strong> • Pending: <strong className="text-amber-600">{stats.contributions.pendingReview}</strong>
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Coins Issued
                </span>
                <div className="text-3xl font-black text-purple-700 mt-2">
                  {stats.coins.issued} 🪙
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Redeemed: <strong>{stats.coins.redeemed}</strong> • Circulating: <strong>{stats.coins.circulating}</strong>
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Partner Stores
                </span>
                <div className="text-3xl font-black text-blue-700 mt-2">
                  {stats.businesses.total}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Approved: <strong>{stats.businesses.approved}</strong> • Pending: <strong className="text-blue-600">{stats.businesses.pendingApproval}</strong>
                </p>
              </div>
            </div>

            {/* Action Alert Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    Pending Waste Reviews
                  </span>
                  <div className="text-2xl font-black text-amber-950 mb-1">
                    {stats.contributions.pendingReview} Submissions Waiting
                  </div>
                  <p className="text-xs text-amber-800">
                    Borderline AI classifications require admin verification to award Green Coins.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('contributions');
                    setContributionFilter('pending_review');
                    fetchContributions('pending_review');
                  }}
                  className="mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition self-start shadow-xs"
                >
                  Review Pending Submissions →
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block mb-1">
                    Merchant Partner Applications
                  </span>
                  <div className="text-2xl font-black text-blue-950 mb-1">
                    {stats.businesses.pendingApproval} Businesses Awaiting Approval
                  </div>
                  <p className="text-xs text-blue-800">
                    Approve local merchants so citizens can redeem Green Coins for store discounts.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('businesses');
                    setBusinessFilter('pending');
                    fetchBusinesses('pending');
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition self-start shadow-xs"
                >
                  Manage Merchant Applications →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 2. REVIEW CONTRIBUTIONS TAB ---------------- */}
        {activeTab === 'contributions' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Citizen Waste Submissions
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Verify photo segregation accuracy and finalize rewards.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {['pending_review', 'approved', 'rejected', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setContributionFilter(st);
                      fetchContributions(st);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      contributionFilter === st
                        ? 'bg-purple-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {contributions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm text-gray-500 font-medium">
                  No submissions with status: <strong>{contributionFilter.replace('_', ' ')}</strong>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contributions.map((c) => (
                  <div
                    key={c._id}
                    className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-200 transition"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.imageUrl}
                          alt="Submitted waste"
                          className="w-full h-full object-contain"
                        />
                        <span
                          className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending_review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Citizen: <strong className="text-gray-900">{c.user?.name || 'Unknown'}</strong></span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase font-bold">Declared</span>
                            <span className="font-bold text-gray-900 capitalize text-sm">{c.declaredCategory}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase font-bold">AI Detected</span>
                            <span className="font-bold text-purple-700 capitalize text-sm">
                              {c.aiCategory} ({Math.round((c.confidence || 0) * 100)}%)
                            </span>
                          </div>
                        </div>

                        {c.aiReason && (
                          <div className="text-gray-600 text-[11px] bg-slate-50 p-2 rounded-lg italic">
                            &quot;{c.aiReason}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {c.status === 'pending_review' ? (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {reviewingId === c._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Review note (optional)"
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReview(c._id, 'approve')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs"
                              >
                                Confirm Approve
                              </button>
                              <button
                                onClick={() => handleReview(c._id, 'reject')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg text-xs"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => setReviewingId(null)}
                                className="px-3 bg-gray-200 text-gray-700 font-bold py-1.5 rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setReviewingId(c._id);
                                setReviewNote('');
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewingId(c._id);
                                setReviewNote('');
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 pt-2 text-[11px] text-gray-400 text-right">
                        Coins Awarded: <strong className="text-emerald-700">+{c.coinsAwarded}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 3. PARTNER APPROVALS TAB ---------------- */}
        {activeTab === 'businesses' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Partner Merchant Applications
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Approve registered stores to enable citizen Green Coin redemptions.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBusinessFilter('all');
                    fetchBusinesses('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    businessFilter === 'all'
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  All ({stats.businesses.total})
                </button>
                <button
                  onClick={() => {
                    setBusinessFilter('pending');
                    fetchBusinesses('pending');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    businessFilter === 'pending'
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Pending ({stats.businesses.pendingApproval})
                </button>
                <button
                  onClick={() => {
                    setBusinessFilter('approved');
                    fetchBusinesses('approved');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    businessFilter === 'approved'
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Approved ({stats.businesses.approved})
                </button>
              </div>
            </div>

            {businesses.length === 0 ? (
              <p className="text-center py-16 text-sm text-gray-500">
                No merchant applications found.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {businesses.map((biz) => (
                  <div
                    key={biz._id}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-base text-gray-900">
                          {biz.name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            biz.isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {biz.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        📍 {biz.address} • Category: <strong className="text-gray-700">{biz.category}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Owner: {biz.owner?.name} ({biz.owner?.email})
                      </p>
                      {biz.discountOffer && (
                        <p className="text-xs text-emerald-700 font-medium mt-1">
                          Offer: {biz.discountOffer}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!biz.isApproved ? (
                        <button
                          onClick={() => handleToggleBusinessApproval(biz._id, true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-xs"
                        >
                          ✓ Approve Partner
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleBusinessApproval(biz._id, false)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl text-xs transition"
                        >
                          Suspend Approval
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 4. PROGRAM RULES CONFIGURATION ---------------- */}
        {activeTab === 'rules' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-xl font-black text-gray-900 mb-1">
              Configure Green Coins Program Rules
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Adjust coin rewards, AI confidence threshold for auto-approval, daily limits, and redemption boundaries.
            </p>

            <form onSubmit={handleSaveRules} className="space-y-6">
              {/* Category Coin Rates */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Green Coins Awarded per Verified Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: 'wet', label: 'Wet (🍎)' },
                    { key: 'dry', label: 'Dry (📦)' },
                    { key: 'recyclable', label: 'Recyclable (♻️)' },
                    { key: 'ewaste', label: 'E-Waste (🔋)' },
                    { key: 'hazardous', label: 'Hazardous (⚠️)' },
                  ].map((item) => (
                    <div key={item.key} className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                      <span className="text-xs font-bold text-gray-700 block mb-1">
                        {item.label}
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={rules.coinsPerCategory?.[item.key] ?? 10}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            coinsPerCategory: {
                              ...rules.coinsPerCategory,
                              [item.key]: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full text-center text-lg font-black text-purple-700 bg-white border border-gray-300 rounded-lg py-1 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold & Quota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    AI Confidence Threshold (0.1 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    value={rules.confidenceThreshold}
                    onChange={(e) =>
                      setRules({ ...rules, confidenceThreshold: parseFloat(e.target.value) || 0.75 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Submissions at or above this confidence are auto-approved. Below this, sent to pending review.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Daily Upload Limit per Citizen
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={rules.dailyContributionLimit}
                    onChange={(e) =>
                      setRules({ ...rules, dailyContributionLimit: parseInt(e.target.value, 10) || 5 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Maximum contributions allowed per citizen within 24 hours.
                  </p>
                </div>
              </div>

              {/* Redemption Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Min Redeem Coins
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rules.minRedeemCoins}
                    onChange={(e) =>
                      setRules({ ...rules, minRedeemCoins: parseInt(e.target.value, 10) || 20 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Max Redeem Coins / Tx
                  </label>
                  <input
                    type="number"
                    min={rules.minRedeemCoins}
                    value={rules.maxRedeemCoinsPerTransaction}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        maxRedeemCoinsPerTransaction: parseInt(e.target.value, 10) || 500,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rupee Value per Coin (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={rules.coinValueInRupees}
                    onChange={(e) =>
                      setRules({ ...rules, coinValueInRupees: parseFloat(e.target.value) || 1.0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingRules}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-sm shadow-xs transition disabled:opacity-50"
              >
                {isSavingRules ? 'Saving Changes...' : 'Save Program Rules'}
              </button>
            </form>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
