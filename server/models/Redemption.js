/**
 * Redemption Model
 * Tracks citizen requests to redeem Green Coins for partner business discounts.
 * Generates unique verification codes with an expiration window and updates status
 * upon merchant confirmation.
 */

const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Redemption must belong to a user'],
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Redemption must specify a target business partner'],
      index: true,
    },
    coins: {
      type: Number,
      required: [true, 'Please specify the number of coins to redeem'],
      min: [1, 'Must redeem at least 1 coin'],
    },
    valueInRupees: {
      type: Number,
      default: 0,
    },
    code: {
      type: String,
      required: [true, 'Unique redemption voucher code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'expired', 'cancelled'],
        message: '{VALUE} is not a valid redemption status',
      },
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
