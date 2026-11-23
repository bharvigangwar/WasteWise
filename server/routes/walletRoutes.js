/**
 * Wallet Routes
 * Mounts endpoints for citizen wallet balance and ledger transaction history.
 */

const express = require('express');
const router = express.Router();
const {
  getWalletOverview,
  getTransactionHistory,
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

// All wallet endpoints require a valid user JWT
router.use(protect);

router.get('/', getWalletOverview);
router.get('/transactions', getTransactionHistory);

module.exports = router;
