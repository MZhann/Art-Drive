const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { uploadPortfolio, uploadAvatar, handleMulterError } = require('../middleware/upload.middleware');

// Validation rules
const updateProfileValidation = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('location.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters')
];

// Public routes
router.get('/photographers', userController.getPhotographers);
router.get('/leaderboard', userController.getLeaderboard);
router.get('/username/:username', userController.getUserByUsername);
router.get('/:id', userController.getUserById);

// Protected routes
router.put('/profile', auth, updateProfileValidation, userController.updateProfile);

// Avatar upload
router.post('/avatar', auth, uploadAvatar.single('avatar'), handleMulterError, userController.uploadAvatar);

// Portfolio routes
router.post('/portfolio', auth, authorize('photographer'), uploadPortfolio.single('image'), handleMulterError, userController.addToPortfolio);
router.put('/portfolio/:photoId', auth, authorize('photographer'), userController.updatePortfolioPhoto);
router.delete('/portfolio/:photoId', auth, authorize('photographer'), userController.removeFromPortfolio);

module.exports = router;
