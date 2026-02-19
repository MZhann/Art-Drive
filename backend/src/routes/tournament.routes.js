const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const tournamentController = require('../controllers/tournament.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

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
  body('coverImage')
    .notEmpty()
    .withMessage('Cover image is required'),
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
    .withMessage('Invalid voting end date')
];

// Public routes
router.get('/', tournamentController.getTournaments);
router.get('/status/live', tournamentController.getLiveTournaments);
router.get('/status/upcoming', tournamentController.getUpcomingTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/leaderboard', tournamentController.getTournamentLeaderboard);

// Protected routes
router.post('/:id/register', auth, authorize('photographer'), tournamentController.registerForTournament);
router.post('/:id/vote/:participantId', auth, tournamentController.voteForParticipant);

// Admin routes
router.post('/', auth, authorize('admin'), createTournamentValidation, tournamentController.createTournament);
router.put('/:id', auth, authorize('admin'), tournamentController.updateTournament);
router.delete('/:id', auth, authorize('admin'), tournamentController.deleteTournament);

module.exports = router;

