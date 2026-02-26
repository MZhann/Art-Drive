const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const tournamentController = require('../controllers/tournament.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { uploadTournament, handleMulterError } = require('../middleware/upload.middleware');

// Validation rules
const createTournamentValidation = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['abstract', 'portrait', 'landscape', 'street', 'nature', 'architecture', 'fashion', 'sports', 'wildlife', 'macro', 'cyberpunk', 'character', 'other'])
    .withMessage('Invalid category'),
  body('registrationStart')
    .isISO8601()
    .withMessage('Invalid registration start date'),
  body('registrationEnd')
    .isISO8601()
    .withMessage('Invalid registration end date'),
  body('votingStart')
    .isISO8601()
    .withMessage('Invalid voting start date'),
  body('votingEnd')
    .isISO8601()
    .withMessage('Invalid voting end date'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 10000 })
    .withMessage('Max participants must be between 2 and 10000'),
  body('rules')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Rules cannot exceed 5000 characters')
];

// Public routes
router.get('/', tournamentController.getTournaments);
router.get('/status/live', tournamentController.getLiveTournaments);
router.get('/status/upcoming', tournamentController.getUpcomingTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/leaderboard', tournamentController.getTournamentLeaderboard);

// Protected routes
router.post('/:id/register', auth, authorize('photographer'), uploadTournament.single('photo'), handleMulterError, tournamentController.registerForTournament);
router.post('/:id/vote/:participantId', auth, tournamentController.voteForParticipant);

// Admin routes
router.post('/', auth, authorize('admin'), createTournamentValidation, tournamentController.createTournament);
router.put('/:id', auth, authorize('admin'), tournamentController.updateTournament);
router.delete('/:id', auth, authorize('admin'), tournamentController.deleteTournament);

module.exports = router;

