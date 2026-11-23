/**
 * Administrator Controller
 * Provides system-wide analytics, manual review of borderline AI contributions,
 * merchant partner approval workflows, and ProgramRule configuration management.
 */

const User = require('../models/User');
const Contribution = require('../models/Contribution');
const Business = require('../models/Business');
const CoinTransaction = require('../models/CoinTransaction');
const ProgramRule = require('../models/ProgramRule');
const coinService = require('../services/coinService');

/**
 * getAdminStats aggregates platform metrics: user counts, contribution statuses,
 * total coins issued, and coins redeemed at merchant partners.
 * 
 * @route GET /api/admin/stats
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      citizensCount,
      businessesCount,
      totalContributions,
      approvedContributions,
      pendingContributions,
      rejectedContributions,
      totalBusinesses,
      pendingBusinesses,
      coinStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'business' }),
      Contribution.countDocuments(),
      Contribution.countDocuments({ status: 'approved' }),
      Contribution.countDocuments({ status: 'pending_review' }),
      Contribution.countDocuments({ status: 'rejected' }),
      Business.countDocuments(),
      Business.countDocuments({ isApproved: false }),
      CoinTransaction.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Parse aggregated coin movements
    let totalCoinsEarned = 0;
    let totalCoinsRedeemed = 0;

    coinStats.forEach((stat) => {
      if (stat._id === 'earn') {
        totalCoinsEarned = stat.totalAmount;
      } else if (stat._id === 'redeem') {
        totalCoinsRedeemed = Math.abs(stat.totalAmount);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          citizens: citizensCount,
          businesses: businessesCount,
        },
        contributions: {
          total: totalContributions,
          approved: approvedContributions,
          pendingReview: pendingContributions,
          rejected: rejectedContributions,
        },
        businesses: {
          total: totalBusinesses,
          pendingApproval: pendingBusinesses,
          approved: totalBusinesses - pendingBusinesses,
        },
        coins: {
          issued: totalCoinsEarned,
          redeemed: totalCoinsRedeemed,
          circulating: Math.max(0, totalCoinsEarned - totalCoinsRedeemed),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getContributionsList retrieves waste submissions filtered by review status.
 * 
 * @route GET /api/admin/contributions
 */
const getContributionsList = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending_review';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = status === 'all' ? {} : { status };

    const [contributions, total] = await Promise.all([
      Contribution.find(query)
        .populate('user', 'name email role')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contribution.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        page,
        pages: Math.ceil(total / limit),
        contributions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * reviewContribution allows an administrator to manually approve or reject a contribution.
 * If approved, automatically credits Green Coins to the citizen's ledger based on ProgramRule.
 * 
 * @route PUT /api/admin/contributions/:id/review
 */
const reviewContribution = async (req, res, next) => {
  try {
    const { action, reviewNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approve' or 'reject'.",
      });
    }

    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found.',
      });
    }

    // Prevent double-approving or double-awarding
    if (contribution.status === 'approved' && action === 'approve') {
      return res.status(400).json({
        success: false,
        message: 'This contribution has already been approved.',
      });
    }

    const rules = await ProgramRule.getRules();

    if (action === 'approve') {
      // Calculate coins for this category from ProgramRule
      let categoryCoins = 10;
      if (rules.coinsPerCategory) {
        categoryCoins = rules.coinsPerCategory.get
          ? rules.coinsPerCategory.get(contribution.declaredCategory)
          : rules.coinsPerCategory[contribution.declaredCategory];
      }
      categoryCoins = Number(categoryCoins) || 10;

      contribution.status = 'approved';
      contribution.coinsAwarded = categoryCoins;
      contribution.reviewedBy = req.user._id;
      if (reviewNote) {
        contribution.aiReason = `${contribution.aiReason ? contribution.aiReason + ' | ' : ''}Admin Note: ${reviewNote}`;
      }
      await contribution.save();

      // Record Green Coins credit in the ledger
      await coinService.recordEarn(
        contribution.user,
        categoryCoins,
        contribution._id,
        reviewNote || `Admin approved ${contribution.declaredCategory} waste contribution`
      );

      return res.status(200).json({
        success: true,
        message: `Contribution approved! Awarded ${categoryCoins} Green Coins to citizen.`,
        data: { contribution },
      });
    } else {
      // Reject contribution
      contribution.status = 'rejected';
      contribution.coinsAwarded = 0;
      contribution.reviewedBy = req.user._id;
      if (reviewNote) {
        contribution.aiReason = `${contribution.aiReason ? contribution.aiReason + ' | ' : ''}Admin Rejection Note: ${reviewNote}`;
      }
      await contribution.save();

      return res.status(200).json({
        success: true,
        message: 'Contribution rejected. No coins awarded.',
        data: { contribution },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * getBusinessesList retrieves merchant partner registrations for admin inspection.
 * 
 * @route GET /api/admin/businesses
 */
const getBusinessesList = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.isApproved !== undefined) {
      filter.isApproved = req.query.isApproved === 'true';
    }

    const businesses = await Business.find(filter)
      .populate('owner', 'name email createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        count: businesses.length,
        businesses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * updateBusinessStatus enables admin to approve or suspend a merchant partner.
 * 
 * @route PUT /api/admin/businesses/:id/status
 */
const updateBusinessStatus = async (req, res, next) => {
  try {
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a boolean isApproved value.',
      });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business partner not found.',
      });
    }

    business.isApproved = isApproved;
    await business.save();

    res.status(200).json({
      success: true,
      message: `Business status updated to ${isApproved ? 'Approved' : 'Pending/Suspended'}.`,
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getProgramRules retrieves current global platform rules for the admin editor.
 * 
 * @route GET /api/admin/rules
 */
const getProgramRules = async (req, res, next) => {
  try {
    const rules = await ProgramRule.getRules();

    res.status(200).json({
      success: true,
      data: { rules },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * updateProgramRules updates platform rules: category reward amounts, confidence threshold,
 * daily limits, and redemption boundaries.
 * 
 * @route PUT /api/admin/rules
 */
const updateProgramRules = async (req, res, next) => {
  try {
    const {
      coinsPerCategory,
      confidenceThreshold,
      dailyContributionLimit,
      minRedeemCoins,
      maxRedeemCoinsPerTransaction,
      coinValueInRupees,
    } = req.body;

    let rules = await ProgramRule.getRules();

    // Validate confidence threshold (0.1 to 1.0)
    if (confidenceThreshold !== undefined) {
      const ct = parseFloat(confidenceThreshold);
      if (isNaN(ct) || ct < 0.1 || ct > 1.0) {
        return res.status(400).json({
          success: false,
          message: 'Confidence threshold must be a number between 0.1 and 1.0',
        });
      }
      rules.confidenceThreshold = ct;
    }

    // Validate daily limit
    if (dailyContributionLimit !== undefined) {
      const dl = parseInt(dailyContributionLimit, 10);
      if (isNaN(dl) || dl < 1) {
        return res.status(400).json({
          success: false,
          message: 'Daily contribution limit must be at least 1',
        });
      }
      rules.dailyContributionLimit = dl;
    }

    // Validate min/max redemption
    if (minRedeemCoins !== undefined) {
      const min = parseInt(minRedeemCoins, 10);
      if (isNaN(min) || min < 1) {
        return res.status(400).json({
          success: false,
          message: 'Minimum redeem coins must be at least 1',
        });
      }
      rules.minRedeemCoins = min;
    }

    if (maxRedeemCoinsPerTransaction !== undefined) {
      const max = parseInt(maxRedeemCoinsPerTransaction, 10);
      if (isNaN(max) || max < rules.minRedeemCoins) {
        return res.status(400).json({
          success: false,
          message: 'Max redeem coins must be greater than or equal to minimum redeem coins',
        });
      }
      rules.maxRedeemCoinsPerTransaction = max;
    }

    // Validate rupee conversion
    if (coinValueInRupees !== undefined) {
      const val = parseFloat(coinValueInRupees);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Coin value in rupees must be a positive number',
        });
      }
      rules.coinValueInRupees = val;
    }

    // Update category coin rewards map
    if (coinsPerCategory && typeof coinsPerCategory === 'object') {
      const categories = ['wet', 'dry', 'recyclable', 'ewaste', 'hazardous'];
      categories.forEach((cat) => {
        if (coinsPerCategory[cat] !== undefined) {
          const coinVal = parseInt(coinsPerCategory[cat], 10);
          if (!isNaN(coinVal) && coinVal >= 0) {
            rules.coinsPerCategory.set(cat, coinVal);
          }
        }
      });
    }

    rules.updatedBy = req.user._id;
    await rules.save();

    res.status(200).json({
      success: true,
      message: 'Program rules updated successfully.',
      data: { rules },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getContributionsList,
  reviewContribution,
  getBusinessesList,
  updateBusinessStatus,
  getProgramRules,
  updateProgramRules,
};
