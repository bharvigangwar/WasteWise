/**
 * CoinTransaction Model (Append-Only Ledger)
 * Records every Green Coin credit and debit. The citizen's coin balance is NEVER
 * stored as a mutable field on the user document; it is always derived dynamically
 * by summing all transaction amounts in this ledger.
 */

const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must be associated with a user'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['earn', 'redeem', 'refund', 'adjust'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      // Positive for earn/refund/adjust-credit, negative for redeem/adjust-debit
    },
    contribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contribution',
      default: null,
      index: true,
    },
    redemption: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Redemption',
      default: null,
      index: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user transaction history pagination
coinTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);
