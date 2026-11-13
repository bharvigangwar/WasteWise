/**
 * Authentication Routes
 * Maps auth endpoints to their respective controller methods.
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Protected endpoints (require valid JWT)
router.get('/me', protect, getMe);

module.exports = router;
