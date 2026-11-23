/**
 * Redemption Controller
 * Implements citizen voucher creation, merchant code confirmation, voucher cancellation,
 * and automatic coin refunding for expired vouchers according to program rules.
 */

const crypto = require('crypto');
const Redemption = require('../models/Redemption');
const Business = require('../models/Business');
const ProgramRule = require('../models/ProgramRule');
const coinService = require('../services/coinService');

/**
 * Generates a short, unique voucher code (e.g., WW-7A9B3C).
 */
const generateRedemptionCode = () => {
  return `WW-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * createRedemption enables a citizen to exchange Green Coins for a merchant discount voucher.
 * Validates program constraints, reserves coins via an append-only 'redeem' ledger entry,
 * and issues a 24-hour expiration code.
 * 
 * @route POST /api/redemptions
 */
const createRedemption = async (req, res, next) => {
  try {
    const { businessId, coins } = req.body;

    const coinsToRedeem = parseInt(coins, 10);
    if (!coinsToRedeem || coinsToRedeem <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive coin amount to redeem.',
      });
    }

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the target business partner.',
      });
    }

    // 1. Validate business partner exists and is approved by admin
    const business = await Business.findById(businessId);
    if (!business || !business.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Selected business is not an active approved partner.',
      });
    }

    // 2. Validate against ProgramRule limits
    const rules = await ProgramRule.getRules();
    const minCoins = rules.minRedeemCoins || 20;
    const maxCoins = rules.maxRedeemCoinsPerTransaction || 500;

    if (coinsToRedeem < minCoins) {
      return res.status(400).json({
        success: false,
        message: `Minimum redemption amount is ${minCoins} Green Coins.`,
      });
    }

    if (coinsToRedeem > maxCoins) {
      return res.status(400).json({
        success: false,
        message: `Maximum redemption limit per voucher is ${maxCoins} Green Coins.`,
      });
    }

    // 3. Verify user has sufficient Green Coins
    const currentBalance = await coinService.getBalance(req.user._id);
    if (currentBalance < coinsToRedeem) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You currently have ${currentBalance} Green Coins.`,
      });
    }

    // 4. Generate unique redemption code & calculate rupee value
    let code = generateRedemptionCode();
    while (await Redemption.findOne({ code })) {
      code = generateRedemptionCode();
    }

    const coinValueInRupees = rules.coinValueInRupees || 1.0;
    const valueInRupees = coinsToRedeem * coinValueInRupees;

    // Voucher valid for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const redemption = await Redemption.create({
      user: req.user._id,
      business: business._id,
      coins: coinsToRedeem,
      valueInRupees,
      code,
      status: 'pending',
      expiresAt,
    });

    // 5. Append debit entry to ledger
    await coinService.recordRedeem(
      req.user._id,
      coinsToRedeem,
      redemption._id,
      `Voucher ${code} for ${business.name}`
    );

    res.status(201).json({
      success: true,
      data: {
        redemption: {
          id: redemption._id,
          code: redemption.code,
          coins: redemption.coins,
          valueInRupees: redemption.valueInRupees,
          status: redemption.status,
          businessName: business.name,
          expiresAt: redemption.expiresAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * confirmRedemption enables a merchant to verify and complete a citizen's voucher.
 * Validates code ownership, status, and expiration.
 * 
 * @route POST /api/redemptions/confirm
 */
const confirmRedemption = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the redemption voucher code.',
      });
    }

    // Identify merchant's registered business
    const business = await Business.findOne({ owner: req.user._id });
    if (!business || !business.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Only approved business partners can confirm redemption vouchers.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const redemption = await Redemption.findOne({ code: cleanCode }).populate('user', 'name email');

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Voucher code not found. Please double-check the code.',
      });
    }

    // Verify voucher belongs to this merchant
    if (redemption.business.toString() !== business._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This voucher code was issued for a different business partner.',
      });
    }

    // Check status
    if (redemption.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `This voucher code was already completed on ${new Date(redemption.completedAt).toLocaleString()}.`,
      });
    }

    if (redemption.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This voucher was cancelled by the citizen.',
      });
    }

    // Check for expiration
    if (redemption.status === 'expired' || new Date() > redemption.expiresAt) {
      if (redemption.status !== 'expired') {
        redemption.status = 'expired';
        await redemption.save();
        // Return coins to citizen
        await coinService.recordRefund(
          redemption.user._id,
          redemption.coins,
          redemption._id,
          `Refund for expired voucher code ${redemption.code}`
        );
      }
      return res.status(400).json({
        success: false,
        message: 'This voucher has expired. The coins have been refunded to the citizen.',
      });
    }

    // Mark completed
    redemption.status = 'completed';
    redemption.completedAt = new Date();
    await redemption.save();

    res.status(200).json({
      success: true,
      message: `Voucher successfully redeemed! Applied discount: ₹${redemption.valueInRupees} (${redemption.coins} coins).`,
      data: {
        redemption,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * cancelRedemption allows a citizen to cancel an unredeemed voucher and receive an immediate refund.
 * 
 * @route POST /api/redemptions/:id/cancel
 */
const cancelRedemption = async (req, res, next) => {
  try {
    const redemption = await Redemption.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found.',
      });
    }

    if (redemption.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a voucher with status: ${redemption.status}.`,
      });
    }

    redemption.status = 'cancelled';
    await redemption.save();

    // Refund coins to ledger
    await coinService.recordRefund(
      req.user._id,
      redemption.coins,
      redemption._id,
      `Refund for cancelled voucher ${redemption.code}`
    );

    res.status(200).json({
      success: true,
      message: 'Voucher cancelled successfully. Coins refunded to your wallet.',
      data: { redemption },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getMyRedemptions returns a citizen's redemption history and auto-refunds any expired vouchers.
 * 
 * @route GET /api/redemptions/my
 */
const getMyRedemptions = async (req, res, next) => {
  try {
    const redemptions = await Redemption.find({ user: req.user._id })
      .populate('business', 'name address category discountOffer')
      .sort({ createdAt: -1 });

    const now = new Date();

    // Check and process any newly expired pending vouchers
    for (const r of redemptions) {
      if (r.status === 'pending' && now > r.expiresAt) {
        r.status = 'expired';
        await r.save();
        await coinService.recordRefund(
          req.user._id,
          r.coins,
          r._id,
          `Automatic refund for expired voucher ${r.code}`
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        count: redemptions.length,
        redemptions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getBusinessRedemptions returns customer vouchers for the logged-in merchant.
 * 
 * @route GET /api/redemptions/business
 */
const getBusinessRedemptions = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) {
      return res.status(200).json({
        success: true,
        data: { redemptions: [] },
      });
    }

    const redemptions = await Redemption.find({ business: business._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        count: redemptions.length,
        redemptions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRedemption,
  confirmRedemption,
  cancelRedemption,
  getMyRedemptions,
  getBusinessRedemptions,
};
