const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const authConfig = require('../config/auth.config');

/**
 * Authentication Middleware
 * Supports both DEV mode (relaxed) and PROD mode (strict JWT)
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    // DEV MODE: Allow requests with dev-token or no token for testing
    if (authConfig.authMode === 'DEV') {
      // Check for dev-mode header
      const devUserId = req.header('X-Dev-User-Id');
      const devUserRole = req.header('X-Dev-User-Role');
      
      if (devUserId) {
        // In DEV mode, allow simulated authentication
        req.user = {
          id: devUserId,
          role: devUserRole || 'photographer',
          email: 'dev@test.com',
          username: 'devuser',
          isDevMode: true
        };
        return next();
      }
    }
    
    // Standard JWT authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Ignore token errors and continue without user
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Check if user has specific permission
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userPermissions = authConfig.permissions[req.user.role] || [];
    
    if (userPermissions.includes('all') || userPermissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: `Permission denied: ${permission}`
    });
  };
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  hasPermission
};

