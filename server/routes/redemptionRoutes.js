/**
 * Redemption Routes
 * Endpoints for creating citizen vouchers, merchant verification, and history tracking.
 */

const express = require('express');
const router = express.Router();
const {
  createRedemption,
  confirmRedemption,
  cancelRedemption,
  getMyRedemptions,
  getBusinessRedemptions,
} = require('../controllers/redemptionController');
const { protect, authorize } = require('../middleware/auth');

// All endpoints require a valid user token
router.use(protect);

// Citizen routes
router.post('/', authorize('citizen'), createRedemption);
router.get('/my', authorize('citizen'), getMyRedemptions);
router.post('/:id/cancel', authorize('citizen'), cancelRedemption);

// Business merchant routes
router.post('/confirm', authorize('business'), confirmRedemption);
router.get('/business', authorize('business'), getBusinessRedemptions);

module.exports = router;
