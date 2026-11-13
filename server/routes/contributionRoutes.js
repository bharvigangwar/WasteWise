/**
 * Contribution Routes
 * Mounts endpoints for uploading waste photos and inspecting submission statuses.
 */

const express = require('express');
const router = express.Router();
const {
  createContribution,
  getMyContributions,
  getContributionById,
} = require('../controllers/contributionController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');

// Citizen upload endpoint (requires authentication and 'citizen' role)
router.post(
  '/',
  protect,
  authorize('citizen'),
  uploadSingleImage('image'),
  createContribution
);

// Citizen submissions history
router.get('/my', protect, authorize('citizen'), getMyContributions);

// Retrieve individual contribution details
router.get('/:id', protect, getContributionById);

module.exports = router;
