/**
 * Authentication and Authorization Middleware
 * Protects routes by validating JWT bearer tokens and restricts access based on user roles.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect ensures that incoming requests have a valid JWT Bearer token in the Authorization header.
 * It decodes the token, verifies the user exists and is active, and attaches the user document to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from 'Authorization: Bearer <token>' header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token was found in the header, deny access
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, no token provided',
    });
  }

  try {
    // Verify token using application secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB excluding password
    const user = await User.findById(decoded.id);

    // If user does not exist or has been deactivated, deny access
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or account has been deactivated',
      });
    }

    // Attach active user to request object for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, invalid or expired token',
    });
  }
};

/**
 * authorize restricts route access to specific user roles (e.g., 'admin', 'business').
 * Must be used after protect middleware so that req.user is populated.
 * 
 * @param  {...string} roles - Permitted user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
