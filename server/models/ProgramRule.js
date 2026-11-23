/**
 * ProgramRule Model
 * Stores global configuration for the Green Coins economy, including coins awarded
 * per waste category, AI confidence verification threshold, daily upload quotas,
 * and redemption constraints. Maintained as a singleton document.
 */

const mongoose = require('mongoose');

const programRuleSchema = new mongoose.Schema(
  {
    coinsPerCategory: {
      type: Map,
      of: Number,
      default: {
        wet: 10,
        dry: 10,
        recyclable: 15,
        ewaste: 25,
        hazardous: 20,
      },
    },
    confidenceThreshold: {
      type: Number,
      default: 0.75,
      min: 0.1,
      max: 1.0,
    },
    dailyContributionLimit: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },
    minRedeemCoins: {
      type: Number,
      default: 20,
      min: 1,
    },
    maxRedeemCoinsPerTransaction: {
      type: Number,
      default: 500,
      min: 10,
    },
    coinValueInRupees: {
      type: Number,
      default: 1.0,
      min: 0.1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * getRules retrieves the single active program rule configuration.
 * Automatically provisions the default document if the collection is empty.
 * 
 * @returns {Promise<Document>} Active ProgramRule document
 */
programRuleSchema.statics.getRules = async function () {
  let rules = await this.findOne();
  if (!rules) {
    rules = await this.create({});
  }
  return rules;
};

module.exports = mongoose.model('ProgramRule', programRuleSchema);
