/**
 * Business Controller
 * Handles business partner registration, profile management, and directory lookup
 * for approved local merchants.
 */

const Business = require('../models/Business');

/**
 * registerBusiness allows users with 'business' role to create or update their business profile.
 * Profiles are submitted with isApproved: false until reviewed by an admin.
 * 
 * @route POST /api/business/register
 */
const registerBusiness = async (req, res, next) => {
  try {
    const { name, address, category, description, discountOffer } = req.body;

    if (!name || !address || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business name, address, and category.',
      });
    }

    // Check if business profile already exists for this owner
    let business = await Business.findOne({ owner: req.user._id });

    if (business) {
      // Update existing profile (preserves current approval status unless changed by admin)
      business.name = name;
      business.address = address;
      business.category = category;
      if (description !== undefined) business.description = description;
      if (discountOffer !== undefined) business.discountOffer = discountOffer;
      await business.save();

      return res.status(200).json({
        success: true,
        data: { business },
      });
    }

    // Create new business profile (defaults to isApproved: false)
    business = await Business.create({
      owner: req.user._id,
      name,
      address,
      category,
      description: description || '',
      discountOffer: discountOffer || 'Accepts Green Coins for checkout discounts',
      isApproved: false,
    });

    res.status(201).json({
      success: true,
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getMyBusiness retrieves the logged-in merchant's business profile.
 * 
 * @route GET /api/business/profile
 */
const getMyBusiness = async (req, res, next) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });

    res.status(200).json({
      success: true,
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getApprovedPartners lists all approved local merchant partners for citizens to explore.
 * 
 * @route GET /api/business/partners
 */
const getApprovedPartners = async (req, res, next) => {
  try {
    const partners = await Business.find({ isApproved: true })
      .select('name address category description discountOffer createdAt')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        count: partners.length,
        partners,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerBusiness,
  getMyBusiness,
  getApprovedPartners,
};
