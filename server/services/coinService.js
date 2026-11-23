/**
 * Green Coin Service
 * Implements ledger calculations, append-only transaction creation,
 * and balance validation for the Green Coins economy.
 */

const mongoose = require('mongoose');
const CoinTransaction = require('../models/CoinTransaction');

/**
 * getBalance dynamically calculates a user's current Green Coins balance
 * by aggregating all append-only ledger transaction entries.
 * 
 * @param {string|ObjectId} userId - Target user ID
 * @returns {Promise<number>} Current calculated balance
 */
const getBalance = async (userId) => {
  const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  const result = await CoinTransaction.aggregate([
    { $match: { user: objectId } },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return result.length > 0 ? Math.max(0, result[0].total) : 0;
};

/**
 * recordEarn appends an 'earn' credit entry to the ledger when a contribution is approved.
 * 
 * @param {ObjectId} userId - Citizen receiving coins
 * @param {number} amount - Positive coin amount
 * @param {ObjectId} [contributionId] - Associated contribution document ID
 * @param {string} [note] - Human-readable explanation
 * @returns {Promise<Document>} Newly recorded CoinTransaction document
 */
const recordEarn = async (userId, amount, contributionId = null, note = 'Earned from waste segregation') => {
  if (amount <= 0) {
    throw new Error('Earn amount must be a positive integer.');
  }

  return await CoinTransaction.create({
    user: userId,
    type: 'earn',
    amount: Math.abs(amount), // Credits are recorded as positive amounts
    contribution: contributionId,
    note,
  });
};

/**
 * recordRedeem appends a 'redeem' debit entry to the ledger when a citizen requests a partner voucher.
 * Verifies that the citizen possesses sufficient balance before deducting.
 * 
 * @param {ObjectId} userId - Citizen spending coins
 * @param {number} amount - Number of coins to redeem
 * @param {ObjectId} [redemptionId] - Associated redemption record ID
 * @param {string} [note] - Human-readable explanation
 * @returns {Promise<Document>} Newly recorded CoinTransaction document
 */
const recordRedeem = async (userId, amount, redemptionId = null, note = 'Redeemed at partner business') => {
  if (amount <= 0) {
    throw new Error('Redeem amount must be a positive integer.');
  }

  const currentBalance = await getBalance(userId);
  if (currentBalance < amount) {
    throw new Error(`Insufficient Green Coins balance. Available: ${currentBalance}, Required: ${amount}`);
  }

  return await CoinTransaction.create({
    user: userId,
    type: 'redeem',
    amount: -Math.abs(amount), // Debits are recorded as negative amounts
    redemption: redemptionId,
    note,
  });
};

/**
 * recordRefund appends a 'refund' credit entry to the ledger when a redemption expires or is cancelled.
 * 
 * @param {ObjectId} userId - Citizen receiving refund
 * @param {number} amount - Coins refunded
 * @param {ObjectId} [redemptionId] - Associated expired/cancelled redemption record ID
 * @param {string} [note] - Human-readable explanation
 * @returns {Promise<Document>} Newly recorded CoinTransaction document
 */
const recordRefund = async (userId, amount, redemptionId = null, note = 'Refunded expired/cancelled redemption') => {
  if (amount <= 0) {
    throw new Error('Refund amount must be a positive integer.');
  }

  return await CoinTransaction.create({
    user: userId,
    type: 'refund',
    amount: Math.abs(amount), // Refunds return coins as positive credits
    redemption: redemptionId,
    note,
  });
};

/**
 * getTransactions retrieves a citizen's transaction history sorted chronologically.
 * 
 * @param {string|ObjectId} userId - Target user ID
 * @param {number} [limit=20] - Number of records to return
 * @param {number} [skip=0] - Number of records to skip
 * @returns {Promise<Array>} List of transaction documents
 */
const getTransactions = async (userId, limit = 20, skip = 0) => {
  return await CoinTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('contribution', 'declaredCategory aiCategory status')
    .lean();
};

module.exports = {
  getBalance,
  recordEarn,
  recordRedeem,
  recordRefund,
  getTransactions,
};
