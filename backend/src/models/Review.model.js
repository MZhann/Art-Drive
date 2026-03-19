const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    default: ''
  },
  recommendation: {
    type: String,
    maxlength: [3000, 'Recommendation letter cannot exceed 3000 characters'],
    default: ''
  }
}, {
  timestamps: true
});

reviewSchema.index({ photographer: 1, createdAt: -1 });
reviewSchema.index({ employer: 1 });
reviewSchema.index({ job: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
