const Review = require('../models/Review.model');
const Job = require('../models/Job.model');
const User = require('../models/User.model');

/**
 * @desc    Mark job as completed and leave a review
 * @route   POST /api/reviews/jobs/:jobId/complete
 * @access  Private (Employer)
 */
const completeJobAndReview = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { rating, comment, recommendation } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id && job.employer.toString() !== req.user._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the job employer can complete this job'
      });
    }

    if (job.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Only in-progress jobs can be marked as completed'
      });
    }

    if (!job.selectedPhotographer) {
      return res.status(400).json({
        success: false,
        message: 'No photographer assigned to this job'
      });
    }

    const existingReview = await Review.findOne({ job: jobId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'A review has already been submitted for this job'
      });
    }

    job.status = 'completed';
    await job.save();

    const review = await Review.create({
      job: jobId,
      employer: req.user.id || req.user._id,
      photographer: job.selectedPhotographer,
      rating: parseInt(rating),
      comment: comment || '',
      recommendation: recommendation || ''
    });

    await review.populate('employer', 'username fullName avatar companyName');
    await review.populate('job', 'title category');

    // Award points to photographer for completing a job
    const photographer = await User.findById(job.selectedPhotographer);
    if (photographer) {
      photographer.points += 50;
      photographer.calculateLevel();
      await photographer.save();
    }

    res.status(201).json({
      success: true,
      message: 'Job completed and review submitted successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Complete job and review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete job and submit review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get reviews for a photographer
 * @route   GET /api/reviews/photographer/:photographerId
 * @access  Public
 */
const getPhotographerReviews = async (req, res) => {
  try {
    const { photographerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ photographer: photographerId })
        .populate('employer', 'username fullName avatar companyName')
        .populate('job', 'title category')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ photographer: photographerId })
    ]);

    // Calculate average rating
    const allReviews = await Review.find({ photographer: photographerId });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get photographer reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get review for a specific job
 * @route   GET /api/reviews/jobs/:jobId
 * @access  Public
 */
const getJobReview = async (req, res) => {
  try {
    const review = await Review.findOne({ job: req.params.jobId })
      .populate('employer', 'username fullName avatar companyName')
      .populate('photographer', 'username fullName avatar')
      .populate('job', 'title category');

    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    console.error('Get job review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  completeJobAndReview,
  getPhotographerReviews,
  getJobReview
};
