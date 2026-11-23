/**
 * Wallet Controller
 * Provides citizen wallet balance and ledger transaction history.
 */

const coinService = require('../services/coinService');
const ProgramRule = require('../models/ProgramRule');

/**
 * getWalletOverview returns the citizen's dynamic coin balance, rupee valuation,
 * and recent transaction records.
 * 
 * @route GET /api/wallet
 */
const getWalletOverview = async (req, res, next) => {
  try {
    const balance = await coinService.getBalance(req.user._id);
    const recentTransactions = await coinService.getTransactions(req.user._id, 10, 0);
    const rules = await ProgramRule.getRules();

    const coinValueInRupees = rules.coinValueInRupees || 1.0;
    const valueInRupees = balance * coinValueInRupees;

    res.status(200).json({
      success: true,
      data: {
        balance,
        valueInRupees,
        coinValueInRupees,
        minRedeemCoins: rules.minRedeemCoins || 20,
        maxRedeemCoinsPerTransaction: rules.maxRedeemCoinsPerTransaction || 500,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getTransactionHistory returns paginated transaction records from the ledger.
 * 
 * @route GET /api/wallet/transactions
 */
const getTransactionHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const transactions = await coinService.getTransactions(req.user._id, limit, skip);

    res.status(200).json({
      success: true,
      data: {
        page,
        count: transactions.length,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWalletOverview,
  getTransactionHistory,
};
