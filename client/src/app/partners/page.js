'use client';

/**
 * Business Partners Directory and Coin Redemption Page
 * Allows citizens to browse approved local businesses, filter by category,
 * and generate instant discount vouchers by redeeming Green Coins.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function PartnersPage() {
  const { user, isAuthenticated } = useAuth();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wallet, setWallet] = useState({ balance: 0, coinValueInRupees: 1, minRedeemCoins: 20, maxRedeemCoinsPerTransaction: 500 });

  // Modal state
  const [activePartner, setActivePartner] = useState(null);
  const [coinsToRedeem, setCoinsToRedeem] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [issuedVoucher, setIssuedVoucher] = useState(null);

  // Load approved partners and user's wallet
  useEffect(() => {
    const fetchData = async () => {
      try {
        const partnersRes = await api.get('/business/partners');
        if (partnersRes.data?.success) {
          setPartners(partnersRes.data.data.partners || []);
        }

        if (isAuthenticated && user?.role === 'citizen') {
          const walletRes = await api.get('/wallet');
          if (walletRes.data?.success) {
            setWallet(walletRes.data.data);
            setCoinsToRedeem(walletRes.data.data.minRedeemCoins || 20);
          }
        }
      } catch (err) {
        console.error('Failed to load partners data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  // Unique categories for filtering
  const categories = ['All', ...new Set(partners.map((p) => p.category).filter(Boolean))];

  const filteredPartners = selectedCategory === 'All'
    ? partners
    : partners.filter((p) => p.category === selectedCategory);

  const handleOpenRedeem = (partner) => {
    setActivePartner(partner);
    setErrorModal('');
    setIssuedVoucher(null);
    setCoinsToRedeem(wallet.minRedeemCoins || 20);
  };

  const handleCloseModal = () => {
    setActivePartner(null);
    setIssuedVoucher(null);
    setErrorModal('');
  };

  const handleConfirmRedemption = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (coinsToRedeem > wallet.balance) {
      setErrorModal(`Insufficient coins. You have ${wallet.balance} Green Coins.`);
      return;
    }

    if (coinsToRedeem < wallet.minRedeemCoins) {
      setErrorModal(`Minimum redemption is ${wallet.minRedeemCoins} Green Coins.`);
      return;
    }

    if (coinsToRedeem > wallet.maxRedeemCoinsPerTransaction) {
      setErrorModal(`Maximum redemption is ${wallet.maxRedeemCoinsPerTransaction} Green Coins.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/redemptions', {
        businessId: activePartner._id,
        coins: coinsToRedeem,
      });

      if (res.data?.success && res.data?.data?.redemption) {
        setIssuedVoucher(res.data.data.redemption);
        // Refresh local wallet balance
        setWallet((prev) => ({
          ...prev,
          balance: Math.max(0, prev.balance - coinsToRedeem),
        }));
      } else {
        setErrorModal('Could not issue voucher. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Redemption failed';
      setErrorModal(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-10 text-white shadow-sm mb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 backdrop-blur-sm px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-3">
            <span>🏪</span> Partner Business Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Spend Your Green Coins Locally
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mt-2">
            Participating neighbourhood stores, cafes, and markets accept Green Coins as instant discounts
            on your purchases. Support eco-friendly commerce!
          </p>

          {isAuthenticated && user?.role === 'citizen' && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20">
              <span className="text-sm text-emerald-200 font-medium">Your Wallet Balance:</span>
              <span className="text-xl font-black text-white">{wallet.balance} 🪙</span>
              <span className="text-xs text-emerald-300">
                (≈ ₹{(wallet.balance * (wallet.coinValueInRupees || 1)).toFixed(0)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3"></div>
          <p className="text-sm text-gray-500 font-medium">Loading partner businesses...</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">🏬</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No Partners Found</h2>
          <p className="text-xs text-gray-500 mb-6">
            There are currently no approved partner businesses in this category. Check back soon!
          </p>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Return to Dashboard →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner._id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-extrabold text-lg text-gray-900 leading-snug">
                    {partner.name}
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    {partner.category}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                  <span>📍</span> {partner.address}
                </p>

                {partner.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {partner.description}
                  </p>
                )}

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 mb-6">
                  <span className="text-[11px] uppercase font-bold text-emerald-900 block mb-0.5">
                    Partner Offer
                  </span>
                  <p className="text-xs text-emerald-800 font-medium">
                    {partner.discountOffer}
                  </p>
                </div>
              </div>

              <div>
                {user?.role === 'citizen' ? (
                  <button
                    onClick={() => handleOpenRedeem(partner)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>🪙</span> Redeem Coins
                  </button>
                ) : !isAuthenticated ? (
                  <Link
                    href="/login"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-xs text-center block transition"
                  >
                    Sign in to Redeem
                  </Link>
                ) : (
                  <div className="text-xs text-center text-gray-400 py-2">
                    Citizen account required to redeem
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redemption Modal */}
      {activePartner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>

            {!issuedVoucher ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                    🪙
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Redeem at {activePartner.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Available balance: <strong className="text-emerald-700">{wallet.balance} Green Coins</strong>
                  </p>
                </div>

                {errorModal && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {errorModal}
                  </div>
                )}

                <form onSubmit={handleConfirmRedemption} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Coins to Redeem (Min: {wallet.minRedeemCoins}, Max: {wallet.maxRedeemCoinsPerTransaction})
                    </label>
                    <input
                      type="number"
                      min={wallet.minRedeemCoins}
                      max={Math.min(wallet.maxRedeemCoinsPerTransaction, wallet.balance)}
                      value={coinsToRedeem}
                      onChange={(e) => setCoinsToRedeem(parseInt(e.target.value, 10) || 0)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-center text-xl font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="mt-2 text-center text-xs text-gray-500">
                      Discount value: <span className="font-bold text-gray-900">₹{(coinsToRedeem * (wallet.coinValueInRupees || 1)).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl text-[11px] text-gray-500 leading-relaxed">
                    💡 Generating a voucher immediately deducts the coins from your ledger. If not used within 24 hours, the coins are automatically refunded to your wallet.
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || wallet.balance < wallet.minRedeemCoins}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Generating...' : 'Confirm Voucher'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                  ✓
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  Voucher Issued!
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                  Present this code to the store cashier at <strong>{issuedVoucher.businessName}</strong>.
                </p>

                {/* Voucher Code Box */}
                <div className="bg-emerald-50 border-2 border-dashed border-emerald-400 p-5 rounded-2xl mb-6">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block mb-1">
                    Redemption Voucher Code
                  </span>
                  <div className="text-3xl font-black tracking-widest text-emerald-950 font-mono select-all">
                    {issuedVoucher.code}
                  </div>
                  <div className="mt-2 text-xs font-bold text-emerald-800">
                    Discount Value: ₹{issuedVoucher.valueInRupees} ({issuedVoucher.coins} coins)
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Expires in 24 hours
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
