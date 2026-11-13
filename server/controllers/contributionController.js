/**
 * Contribution Controller
 * Manages photo submissions of segregated household waste.
 * Enforces duplicate image prevention, daily submission limits,
 * image uploading, and automatic AI verification via Gemini Vision.
 */

const crypto = require('crypto');
const Contribution = require('../models/Contribution');
const { uploadImageBuffer } = require('../config/cloudinary');
const { classifyWaste } = require('../services/aiClassifier');

/**
 * createContribution handles submission of a new waste photo.
 * Computes SHA-256 hash, enforces duplicate & quota rules, uploads image,
 * invokes Gemini vision classification, and determines initial status.
 * 
 * @route POST /api/contributions
 */
const createContribution = async (req, res, next) => {
  try {
    const { declaredCategory } = req.body;

    // Validate image file attachment
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image of your segregated household waste.',
      });
    }

    // Validate declared waste category
    const validDeclared = ['wet', 'dry', 'recyclable', 'ewaste', 'hazardous'];
    if (!declaredCategory || !validDeclared.includes(declaredCategory.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Please specify a valid declared category: ${validDeclared.join(', ')}`,
      });
    }

    const category = declaredCategory.toLowerCase();

    // 1. Compute SHA-256 hash of image buffer to detect duplicate submissions
    const imageHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    // Rule 1: Reject duplicate image submissions
    const existingSubmission = await Contribution.findOne({ imageHash });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'This exact image has already been submitted. Duplicate photos are not accepted.',
      });
    }

    // Rule 2: Enforce daily contribution limit (default: 5 submissions per calendar day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaySubmissionsCount = await Contribution.countDocuments({
      user: req.user._id,
      createdAt: { $gte: startOfDay },
    });

    const dailyContributionLimit = 5;
    if (todaySubmissionsCount >= dailyContributionLimit) {
      return res.status(400).json({
        success: false,
        message: `You have reached your daily contribution limit of ${dailyContributionLimit} submissions today.`,
      });
    }

    // Upload image to Cloudinary (or local data-URL fallback if keys not yet set)
    const imageUrl = await uploadImageBuffer(
      req.file.buffer,
      'wastewise_contributions',
      req.file.mimetype
    );

    // 3. Call Google Gemini Vision classifier
    const aiResult = await classifyWaste(req.file.buffer, req.file.mimetype);

    // Rule 3: Evaluate verification status based on AI result and confidence threshold
    const confidenceThreshold = 0.75;
    let status = 'pending_review';
    let coinsAwarded = 0;

    if (aiResult.category === category && aiResult.confidence >= confidenceThreshold) {
      // AI confirms citizen declaration with high confidence
      status = 'approved';
      coinsAwarded = 10; // Default award per verified contribution
    } else if (aiResult.confidence < 0.40 || aiResult.category === 'unknown') {
      // Very low confidence or unidentifiable image
      status = 'rejected';
      coinsAwarded = 0;
    } else {
      // Borderline confidence or category mismatch requiring human review
      status = 'pending_review';
      coinsAwarded = 0;
    }

    // Save contribution record in MongoDB
    const contribution = await Contribution.create({
      user: req.user._id,
      imageUrl,
      imageHash,
      declaredCategory: category,
      aiCategory: aiResult.category,
      confidence: aiResult.confidence,
      aiReason: aiResult.reason,
      status,
      coinsAwarded,
    });

    res.status(201).json({
      success: true,
      data: {
        contribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getMyContributions retrieves all waste submissions created by the logged-in citizen.
 * 
 * @route GET /api/contributions/my
 */
const getMyContributions = async (req, res, next) => {
  try {
    const contributions = await Contribution.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        count: contributions.length,
        contributions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getContributionById retrieves a single contribution by its ID.
 * Citizen may only view their own contributions; Admins may view any.
 * 
 * @route GET /api/contributions/:id
 */
const getContributionById = async (req, res, next) => {
  try {
    const contribution = await Contribution.findById(req.params.id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found',
      });
    }

    // Citizens can only inspect their own submissions
    const isOwner = contribution.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this contribution.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        contribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContribution,
  getMyContributions,
  getContributionById,
};
