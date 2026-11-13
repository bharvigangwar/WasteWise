/**
 * Contribution Model
 * Tracks waste photo submissions uploaded by citizens, including image hash for
 * duplicate detection, citizen declared category, AI vision verification results,
 * approval status, and Green Coins awarded.
 */

const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contribution must belong to a user'],
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image URL'],
    },
    imageHash: {
      type: String,
      required: [true, 'Image SHA-256 hash is required for duplicate checking'],
      index: true,
    },
    declaredCategory: {
      type: String,
      required: [true, 'Please specify the declared waste category'],
      enum: {
        values: ['wet', 'dry', 'recyclable', 'ewaste', 'hazardous'],
        message: '{VALUE} is not a valid waste category',
      },
    },
    aiCategory: {
      type: String,
      enum: {
        values: ['wet', 'dry', 'recyclable', 'ewaste', 'hazardous', 'unknown'],
        message: '{VALUE} is not a valid AI category',
      },
      default: 'unknown',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    aiReason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['approved', 'rejected', 'pending_review'],
        message: '{VALUE} is not a valid contribution status',
      },
      default: 'pending_review',
      index: true,
    },
    coinsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user contributions created today for daily quota enforcement
contributionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Contribution', contributionSchema);
