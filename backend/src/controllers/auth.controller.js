const User = require('../models/User.model');
const authConfig = require('../config/auth.config');
const { validationResult } = require('express-validator');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password, username, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Validate role
    const allowedRoles = ['photographer', 'employer'];
    const userRole = allowedRoles.includes(role) ? role : 'photographer';

    // Create user
    const user = await User.create({
      email,
      password,
      username,
      fullName,
      role: userRole
    });

    // Generate token
    const token = user.generateAuthToken();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // In DEV mode with simulated auth
    if (req.user.isDevMode) {
      return res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            username: req.user.username,
            role: req.user.role,
            fullName: 'Dev User',
            isDevMode: true
          }
        }
      });
    }

    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  // In a more advanced setup, we could blacklist the token
  // For now, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * @desc    DEV MODE: Create test users
 * @route   POST /api/auth/dev/create-test-users
 * @access  Public (DEV mode only)
 */
const createTestUsers = async (req, res) => {
  try {
    if (authConfig.authMode !== 'DEV') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in DEV mode'
      });
    }

    const testUsers = [
      {
        email: 'photographer@test.com',
        password: 'test123',
        username: 'test_photographer',
        fullName: 'Test Photographer',
        role: 'photographer'
      },
      {
        email: 'employer@test.com',
        password: 'test123',
        username: 'test_employer',
        fullName: 'Test Employer',
        role: 'employer',
        companyName: 'Test Company'
      },
      {
        email: 'admin@test.com',
        password: 'admin123',
        username: 'test_admin',
        fullName: 'Test Admin',
        role: 'admin'
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const user = await User.create(userData);
        createdUsers.push({
          email: user.email,
          username: user.username,
          role: user.role
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Test users created',
      data: {
        created: createdUsers,
        credentials: testUsers.map(u => ({ email: u.email, password: u.password, role: u.role }))
      }
    });
  } catch (error) {
    console.error('Create test users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test users',
      error: error.message
    });
  }
};

/**
 * @desc    Get auth configuration (for frontend)
 * @route   GET /api/auth/config
 * @access  Public
 */
const getAuthConfig = async (req, res) => {
  res.json({
    success: true,
    data: {
      authMode: authConfig.authMode,
      roles: Object.values(authConfig.roles),
      isDev: authConfig.authMode === 'DEV'
    }
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  createTestUsers,
  getAuthConfig
};

