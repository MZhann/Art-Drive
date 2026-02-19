const User = require('../models/User.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

/**
 * @desc    Get user by username (public profile)
 * @route   GET /api/users/username/:username
 * @access  Public
 */
const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

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
    console.error('Get user by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const allowedUpdates = [
      'fullName',
      'bio',
      'location',
      'socialLinks',
      'companyName',
      'companyDescription',
      'avatar'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * @desc    Get all photographers (with filters)
 * @route   GET /api/users/photographers
 * @access  Public
 */
const getPhotographers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-points',
      city,
      search
    } = req.query;

    const query = { role: 'photographer', isActive: true };

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { fullName: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [photographers, total] = await Promise.all([
      User.find(query)
        .select('username fullName avatar bio location points level badges stats')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        photographers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get photographers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get photographers'
    });
  }
};

/**
 * @desc    Get leaderboard
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await User.find({ role: 'photographer', isActive: true })
      .select('username fullName avatar points level badges stats.tournamentsWon')
      .sort('-points')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((user, index) => ({
          rank: index + 1,
          ...user.toObject()
        }))
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
};

/**
 * @desc    Add photo to portfolio
 * @route   POST /api/users/portfolio
 * @access  Private (Photographer)
 */
const addToPortfolio = async (req, res) => {
  try {
    const { imageUrl, title, description } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.portfolio.push({
      imageUrl,
      title: title || '',
      description: description || ''
    });

    user.stats.totalPhotosUploaded += 1;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Photo added to portfolio',
      data: {
        portfolio: user.portfolio
      }
    });
  } catch (error) {
    console.error('Add to portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add photo to portfolio'
    });
  }
};

/**
 * @desc    Remove photo from portfolio
 * @route   DELETE /api/users/portfolio/:photoId
 * @access  Private (Photographer)
 */
const removeFromPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.portfolio = user.portfolio.filter(
      photo => photo._id.toString() !== req.params.photoId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Photo removed from portfolio',
      data: {
        portfolio: user.portfolio
      }
    });
  } catch (error) {
    console.error('Remove from portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove photo from portfolio'
    });
  }
};

module.exports = {
  getUserById,
  getUserByUsername,
  updateProfile,
  getPhotographers,
  getLeaderboard,
  addToPortfolio,
  removeFromPortfolio
};

