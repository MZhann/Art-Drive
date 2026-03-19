const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.post('/jobs/:jobId/complete', auth, authorize('employer'), reviewController.completeJobAndReview);
router.get('/photographer/:photographerId', reviewController.getPhotographerReviews);
router.get('/jobs/:jobId', reviewController.getJobReview);

module.exports = router;
