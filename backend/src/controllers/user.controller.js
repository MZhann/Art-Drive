const User = require('../models/User.model');
const Job = require('../models/Job.model');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

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

    // Check if viewer was hired by this employer
    let isHiredBy = false;
    if (req.user && req.user.role === 'photographer' && user.role === 'employer') {
      // Check if photographer was hired (accepted) by this employer
      const hiredJob = await Job.findOne({
        employer: user._id,
        selectedPhotographer: req.user.id || req.user._id,
        status: { $in: ['in-progress', 'completed'] }
      });
      isHiredBy = !!hiredJob;
    }

    const viewerId = req.user ? (req.user.id || req.user._id) : null;
    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(viewerId, isHiredBy)
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
      'avatar',
      'contact',
      'showContactPublicly'
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
 * @desc    Upload avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old avatar file if it exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar path
    const avatarUrl = `uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarUrl,
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
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
 * @desc    Add photo to portfolio (with file upload)
 * @route   POST /api/users/portfolio
 * @access  Private (Photographer)
 */
const addToPortfolio = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, description } = req.body;

    // Support both file upload and URL-based addition
    let imageUrl;
    if (req.file) {
      imageUrl = `uploads/portfolio/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file or provide an image URL'
      });
    }

    const user = await User.findById(userId);

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

    // Award points for uploading a photo
    user.points += 5;
    user.calculateLevel();

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Photo added to portfolio',
      data: {
        portfolio: user.portfolio,
        photo: user.portfolio[user.portfolio.length - 1]
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
 * @desc    Update portfolio photo details
 * @route   PUT /api/users/portfolio/:photoId
 * @access  Private (Photographer)
 */
const updatePortfolioPhoto = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, description } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const photo = user.portfolio.id(req.params.photoId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found in portfolio'
      });
    }

    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;

    await user.save();

    res.json({
      success: true,
      message: 'Portfolio photo updated',
      data: {
        photo,
        portfolio: user.portfolio
      }
    });
  } catch (error) {
    console.error('Update portfolio photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update portfolio photo'
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

    const photo = user.portfolio.id(req.params.photoId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found in portfolio'
      });
    }

    // Delete the file from disk if it's a local upload
    if (photo.imageUrl && photo.imageUrl.startsWith('uploads/')) {
      const filePath = path.join(__dirname, '../../', photo.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.portfolio = user.portfolio.filter(
      p => p._id.toString() !== req.params.photoId
    );

    if (user.stats.totalPhotosUploaded > 0) {
      user.stats.totalPhotosUploaded -= 1;
    }

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
  uploadAvatar,
  getPhotographers,
  getLeaderboard,
  addToPortfolio,
  updatePortfolioPhoto,
  removeFromPortfolio
};
