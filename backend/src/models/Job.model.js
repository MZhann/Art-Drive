const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  photographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  message: {
    type: String,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['wedding', 'portrait', 'event', 'commercial', 'fashion', 'real-estate', 'food', 'sports', 'travel', 'other'],
    default: 'other'
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget must be positive']
  },
  budgetType: {
    type: String,
    enum: ['fixed', 'negotiable'],
    default: 'negotiable'
  },
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: 'Kazakhstan' },
    address: { type: String, default: '' }
  },
  requirements: {
    type: String,
    maxlength: [2000, 'Requirements cannot exceed 2000 characters'],
    default: ''
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [applicationSchema],
  selectedPhotographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Metadata
  views: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Contact visibility settings
  showContactPublicly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
jobSchema.index({ employer: 1, status: 1 });
jobSchema.index({ status: 1, category: 1, deadline: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'applications.photographer': 1 });

// Virtual for application count
jobSchema.virtual('applicationCount').get(function() {
  return this.applications ? this.applications.length : 0;
});

// Method to check if photographer has already applied
jobSchema.methods.hasApplied = function(photographerId) {
  return this.applications.some(
    app => app.photographer.toString() === photographerId.toString()
  );
};

// Method to get application by photographer
jobSchema.methods.getApplication = function(photographerId) {
  return this.applications.find(
    app => app.photographer.toString() === photographerId.toString()
  );
};

module.exports = mongoose.model('Job', jobSchema);

