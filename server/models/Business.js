/**
 * Business Model
 * Represents a local merchant / business partner participating in the Green Coins program.
 * Business profiles require administrator approval before citizens can redeem vouchers.
 */

const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business must belong to a registered user'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide the business name'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Please provide the business location/address'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a business category (e.g. Grocery, Cafe, Retail)'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    discountOffer: {
      type: String,
      default: 'Accepts Green Coins for instant checkout discounts',
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Business', businessSchema);
