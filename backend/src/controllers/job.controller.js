const mongoose = require('mongoose');
const Job = require('../models/Job.model');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new job posting
 * @route   POST /api/jobs
 * @access  Private (Employer)
 */
const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      budget,
      budgetType,
      location,
      requirements,
      deadline,
      tags,
      showContactPublicly
    } = req.body;

    const job = await Job.create({
      title,
      description,
      category,
      budget: parseFloat(budget),
      budgetType: budgetType || 'negotiable',
      location: location || {},
      requirements: requirements || '',
      deadline: new Date(deadline),
      tags: tags || [],
      showContactPublicly: showContactPublicly === true || showContactPublicly === 'true',
      employer: req.user.id
    });

    await job.populate('employer', 'username fullName avatar companyName');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all jobs (with filters)
 * @route   GET /api/jobs
 * @access  Public
 */
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      status = 'open',
      category,
      city,
      sort = '-createdAt',
      search
    } = req.query;

    const query = { status };

    if (category) {
      query.category = category;
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('employer', 'username fullName avatar companyName')
        .select('-applications') // Don't include applications in list view
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'username fullName avatar companyName companyDescription contact')
      .populate('applications.photographer', 'username fullName avatar bio portfolio points level stats location')
      .populate('selectedPhotographer', 'username fullName avatar contact');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views
    job.views += 1;
    await job.save();

    // Hide contact info unless:
    // 1. Employer chose to show contacts publicly (showContactPublicly = true)
    // 2. Application is accepted (photographer can see contact)
    // 3. User is the employer (can see all)
    const responseJob = job.toObject();
    
    if (req.user) {
      if (req.user.id === job.employer._id.toString()) {
        // Employer can see all
      } else if (req.user.role === 'photographer') {
        const application = job.applications.find(
          app => {
            const photographerId = app.photographer?._id || app.photographer;
            return photographerId?.toString() === req.user.id?.toString() && app.status === 'accepted';
          }
        );
        if (!application && !job.showContactPublicly) {
          // Hide employer contact if not accepted and not shown publicly
          responseJob.employer.contact = undefined;
        }
      } else {
        // Hide employer contact for other roles
        if (!job.showContactPublicly) {
          responseJob.employer.contact = undefined;
        }
      }
    } else {
      // Not logged in - show contact only if employer chose to show publicly
      if (!job.showContactPublicly) {
        responseJob.employer.contact = undefined;
      }
    }

    res.json({
      success: true,
      data: { job: responseJob }
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get jobs posted by employer
 * @route   GET /api/jobs/my-jobs
 * @access  Private (Employer)
 */
const getMyJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { employer: req.user.id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('applications.photographer', 'username fullName avatar bio portfolio points level stats location')
        .populate('selectedPhotographer', 'username fullName avatar contact')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Apply for a job
 * @route   POST /api/jobs/:id/apply
 * @access  Private (Photographer)
 */
const applyForJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { proposedPrice, message } = req.body;
    const jobId = req.params.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    if (job.hasApplied(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    job.applications.push({
      photographer: req.user.id,
      proposedPrice: parseFloat(proposedPrice),
      message: message || ''
    });

    await job.save();
    await job.populate('applications.photographer', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Accept/reject application
 * @route   PATCH /api/jobs/:id/applications/:applicationId
 * @access  Private (Employer)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this application'
      });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // If accepting, reject all other applications and set selected photographer
    if (status === 'accepted') {
      job.applications.forEach(app => {
        if (app._id.toString() !== applicationId) {
          app.status = 'rejected';
        }
      });
      application.status = 'accepted';
      job.selectedPhotographer = application.photographer;
      job.status = 'in-progress';
    } else {
      application.status = 'rejected';
    }

    await job.save();
    await job.populate('applications.photographer', 'username fullName avatar bio portfolio points level stats location');
    await job.populate('selectedPhotographer', 'username fullName avatar contact');

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: { job }
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get photographer's applications
 * @route   GET /api/jobs/my-applications
 * @access  Private (Photographer)
 */
const getMyApplications = async (req, res) => {
  try {
    // Find all jobs where the photographer has applied
    // Convert user.id to ObjectId for proper MongoDB query
    const photographerId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;
    
    const jobs = await Job.find({
      'applications.photographer': photographerId
    })
      .populate('employer', 'username fullName avatar companyName companyDescription contact')
      .populate('applications.photographer', 'username fullName avatar bio portfolio points level stats location')
      .sort('-createdAt');

    const applications = [];
    
    jobs.forEach(job => {
      // Find the application for this photographer
      const application = job.applications.find(
        app => {
          const photographerId = app.photographer?._id || app.photographer;
          return photographerId?.toString() === req.user.id?.toString();
        }
      );
      
      if (application) {
        // Convert to plain object and add job info
        const appObj = application.toObject ? application.toObject() : application;
        applications.push({
          ...appObj,
          job: {
            _id: job._id,
            title: job.title,
            category: job.category,
            budget: job.budget,
            budgetType: job.budgetType,
            location: job.location,
            status: job.status,
            deadline: job.deadline,
            createdAt: job.createdAt,
            showContactPublicly: job.showContactPublicly,
            employer: job.employer
          }
        });
      }
    });

    // Sort by applied date (newest first)
    applications.sort((a, b) => {
      const dateA = new Date(a.appliedAt || a.createdAt || 0);
      const dateB = new Date(b.appliedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      data: {
        applications
      }
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get applications for a job
 * @route   GET /api/jobs/:id/applications
 * @access  Private (Employer)
 */
const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('applications.photographer', 'username fullName avatar bio portfolio points level stats location')
      .populate('selectedPhotographer', 'username fullName avatar contact');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these applications'
      });
    }

    res.json({
      success: true,
      data: {
        applications: job.applications,
        selectedPhotographer: job.selectedPhotographer
      }
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update job status
 * @route   PATCH /api/jobs/:id/status
 * @access  Private (Employer)
 */
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this job'
      });
    }

    job.status = status;
    await job.save();

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: { job }
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Employer)
 */
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this job'
      });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  getMyApplications,
  applyForJob,
  updateApplicationStatus,
  getJobApplications,
  updateJobStatus,
  deleteJob
};

