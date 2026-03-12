const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jobController = require('../controllers/job.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// Validation rules
const createJobValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim(),
  body('description')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('category')
    .isIn(['wedding', 'portrait', 'event', 'commercial', 'fashion', 'real-estate', 'food', 'sports', 'travel', 'other'])
    .withMessage('Invalid category'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('budgetType')
    .optional()
    .isIn(['fixed', 'negotiable'])
    .withMessage('Budget type must be fixed or negotiable'),
  body('deadline')
    .isISO8601()
    .withMessage('Invalid deadline date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('requirements')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Requirements cannot exceed 2000 characters'),
  body('location.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  body('location.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const applyForJobValidation = [
  body('proposedPrice')
    .isFloat({ min: 0 })
    .withMessage('Proposed price must be a positive number'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

// Public routes
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

// Protected routes - Employer
router.post('/', auth, authorize('employer'), createJobValidation, jobController.createJob);
router.get('/my-jobs/list', auth, authorize('employer'), jobController.getMyJobs);
router.get('/my-jobs', auth, authorize('employer'), jobController.getMyJobs);
router.patch('/:id/status', auth, authorize('employer'), jobController.updateJobStatus);
router.delete('/:id', auth, authorize('employer'), jobController.deleteJob);
router.get('/:id/applications', auth, authorize('employer'), jobController.getJobApplications);
router.patch('/:id/applications/:applicationId', auth, authorize('employer'), jobController.updateApplicationStatus);

// Protected routes - Photographer
router.post('/:id/apply', auth, authorize('photographer'), applyForJobValidation, jobController.applyForJob);

module.exports = router;

