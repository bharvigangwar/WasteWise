/**
 * Business Routes
 * Endpoints for merchant registration, profile management, and directory lookup.
 */

const express = require('express');
const router = express.Router();
const {
  registerBusiness,
  getMyBusiness,
  getApprovedPartners,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

// Public directory of approved partner merchants
router.get('/partners', getApprovedPartners);

// Protected routes for business owners
router.post('/register', protect, authorize('business'), registerBusiness);
router.get('/profile', protect, authorize('business'), getMyBusiness);

module.exports = router;
