/**
 * Admin Routes
 * Endpoints for platform metrics, manual contribution reviews, merchant approvals,
 * and dynamic program rule configuration. All routes require admin authorization.
 */

const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getContributionsList,
  reviewContribution,
  getBusinessesList,
  updateBusinessStatus,
  getProgramRules,
  updateProgramRules,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Require authentication and 'admin' role on all admin routes
router.use(protect, authorize('admin'));

// Platform analytics
router.get('/stats', getAdminStats);

// Manual review of citizen contributions
router.get('/contributions', getContributionsList);
router.put('/contributions/:id/review', reviewContribution);

// Merchant partner management
router.get('/businesses', getBusinessesList);
router.put('/businesses/:id/status', updateBusinessStatus);

// Program rule configuration
router.get('/rules', getProgramRules);
router.put('/rules', updateProgramRules);

module.exports = router;
