import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, reviewAPI, getImageUrl } from '../services/api.service';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  User,
  Send,
  MessageCircle,
  Phone,
  Loader,
  CheckCircle,
  XCircle,
  Tag,
  Star,
  FileText
} from 'lucide-react';
import './JobDetail.css';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyFormData, setApplyFormData] = useState({
    proposedPrice: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [jobReview, setJobReview] = useState(null);

  const fetchJob = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await jobAPI.getById(id);
      if (response.data.success) {
        const jobData = response.data.data.job;
        setJob(jobData);
        
        // Check if current user has applied
        if (isAuthenticated && user?.role === 'photographer' && jobData.applications) {
          const application = jobData.applications.find(
            app => {
              const photographerId = app.photographer?._id || app.photographer;
              return photographerId?.toString() === user.id?.toString();
            }
          );
          if (application) {
            setMyApplication(application);
            setApplyFormData({
              proposedPrice: application.proposedPrice.toString(),
              message: application.message || ''
            });
          } else {
            setApplyFormData({
              proposedPrice: jobData.budget.toString(),
              message: ''
            });
          }
        } else if (!isAuthenticated || user?.role !== 'photographer') {
          setMyApplication(null);
        }
      } else {
        toast.error('Job not found');
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job');
      navigate('/jobs');
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, user, navigate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (job?.status === 'completed') {
      reviewAPI.getJobReview(job._id)
        .then(res => {
          if (res.data.success && res.data.data.review) {
            setJobReview(res.data.data.review);
          }
        })
        .catch(() => {});
    }
  }, [job?._id, job?.status]);

  const handleApply = () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }
    if (user?.role !== 'photographer') {
      toast.error('Only photographers can apply for jobs');
      return;
    }
    if (myApplication) {
      toast.info('You have already applied for this job');
      return;
    }
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await jobAPI.apply(job._id, {
        proposedPrice: parseFloat(applyFormData.proposedPrice),
        message: applyFormData.message
      });

      if (response.data.success) {
        toast.success('Application submitted successfully!');
        setShowApplyModal(false);
        fetchJob(); // Refresh to get updated job with application
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
      console.error('Error applying for job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canSeeContact = () => {
    if (!job || !job.employer?.contact) return false;
    // Check if contact info exists
    if (!job.employer.contact.whatsapp && !job.employer.contact.telegram) {
      return false;
    }
    // If employer chose to show contacts publicly, anyone can see
    if (job.showContactPublicly) {
      return true;
    }
    if (!isAuthenticated || !user) return false;
    // Photographer can see contact if their application was accepted
    if (user.role === 'photographer') {
      // Check if application exists and is accepted
      if (myApplication && myApplication.status === 'accepted') {
        return true;
      }
      // Also check in job.applications array
      const acceptedApp = job.applications?.find(
        app => {
          const photographerId = app.photographer?._id || app.photographer;
          return photographerId?.toString() === user.id?.toString() && app.status === 'accepted';
        }
      );
      if (acceptedApp) {
        return true;
      }
    }
    // Employer can always see their own job
    if (user.role === 'employer') {
      const employerId = job.employer?._id || job.employer;
      if (employerId?.toString() === user.id?.toString()) {
        return true;
      }
    }
    return false;
  };

  const openWhatsApp = (phone) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const openTelegram = (username) => {
    const cleanUsername = username.replace('@', '');
    window.open(`https://t.me/${cleanUsername}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="job-detail-page">
        <div className="container">
          <div className="loading-state">
            <Loader size={32} className="spin" />
            <p>Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="job-detail-page">
      <div className="container">
        <Link to="/jobs" className="back-link">
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>

        <div className="job-detail-header">
          <div>
            <span className="job-category">{job.category}</span>
            <h1>{job.title}</h1>
            <div className="job-meta">
              <div className="meta-item">
                <MapPin size={18} />
                <span>
                  {job.location?.city ? `${job.location.city}, ` : ''}
                  {job.location?.country || 'Kazakhstan'}
                </span>
              </div>
              <div className="meta-item">
                <Calendar size={18} />
                <span>Deadline: {formatDate(job.deadline)}</span>
              </div>
              <div className="meta-item">
                <Clock size={18} />
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="job-budget">
            <DollarSign size={24} />
            <div>
              <span className="budget-amount">{formatCurrency(job.budget)}</span>
              <span className="budget-type">{job.budgetType === 'negotiable' ? 'Negotiable' : 'Fixed'}</span>
            </div>
          </div>
        </div>

        <div className="job-detail-content">
          <div className="job-main">
            <div className="job-section">
              <h2>Job Description</h2>
              <p className="job-description">{job.description}</p>
            </div>

            {job.requirements && (
              <div className="job-section">
                <h2>Requirements</h2>
                <p className="job-requirements">{job.requirements}</p>
              </div>
            )}

            {job.tags && job.tags.length > 0 && (
              <div className="job-section">
                <h2>Tags</h2>
                <div className="job-tags">
                  {job.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      <Tag size={14} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="job-section">
              <h2>Employer</h2>
              <div className="employer-card">
                <div className="employer-avatar">
                  {job.employer?.avatar ? (
                    <img src={getImageUrl(job.employer.avatar)} alt={job.employer.fullName} />
                  ) : (
                    <span>{job.employer?.fullName?.charAt(0) || 'E'}</span>
                  )}
                </div>
                <div className="employer-info">
                  <h3>{job.employer?.fullName}</h3>
                  {job.employer?.companyName && (
                    <p className="company-name">{job.employer.companyName}</p>
                  )}
                  <p className="employer-username">@{job.employer?.username}</p>
                  {job.employer?.bio && (
                    <p className="employer-bio">{job.employer.bio}</p>
                  )}
                </div>
                <Link
                  to={`/profile/${job.employer?.username}`}
                  className="btn btn-outline"
                >
                  <User size={16} />
                  View Profile
                </Link>
              </div>
            </div>

            {/* Contact Information - Visible if showContactPublicly is true or application accepted */}
            {canSeeContact() && job.employer?.contact && (
              <div className="job-section contact-section">
                <h2>Contact Information</h2>
                <div className="contact-info">
                  {job.employer.contact.whatsapp && (
                    <button
                      className="contact-btn whatsapp"
                      onClick={() => openWhatsApp(job.employer.contact.whatsapp)}
                    >
                      <Phone size={18} />
                      WhatsApp: {job.employer.contact.whatsapp}
                    </button>
                  )}
                  {job.employer.contact.telegram && (
                    <button
                      className="contact-btn telegram"
                      onClick={() => openTelegram(job.employer.contact.telegram)}
                    >
                      <MessageCircle size={18} />
                      Telegram: {job.employer.contact.telegram}
                    </button>
                  )}
                </div>
                {!job.showContactPublicly && myApplication?.status === 'accepted' && (
                  <p className="contact-note">
                    <CheckCircle size={16} />
                    Your application has been accepted! You can now contact the employer.
                  </p>
                )}
                {job.showContactPublicly && (
                  <p className="contact-note">
                    <CheckCircle size={16} />
                    Employer has made their contact information public. Feel free to reach out!
                  </p>
                )}
              </div>
            )}

            {/* Job Review - shown for completed jobs */}
            {job.status === 'completed' && jobReview && (
              <div className="job-section">
                <h2>Employer Review</h2>
                <div className="job-review-card">
                  <div className="job-review-header">
                    <div className="job-review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          fill={s <= jobReview.rating ? 'currentColor' : 'none'}
                          style={{ color: s <= jobReview.rating ? 'var(--color-accent-yellow, #f59e0b)' : 'var(--color-text-muted)' }}
                        />
                      ))}
                      <span className="review-rating-num">{jobReview.rating}/5</span>
                    </div>
                    <span className="review-date-sm">
                      {new Date(jobReview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {jobReview.comment && (
                    <p className="job-review-comment">{jobReview.comment}</p>
                  )}
                  {jobReview.recommendation && (
                    <div className="job-review-recommendation">
                      <div className="recommendation-label">
                        <FileText size={14} />
                        Recommendation Letter
                      </div>
                      <p>{jobReview.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Status */}
            {isAuthenticated && user?.role === 'photographer' && myApplication && (
              <div className="job-section">
                <h2>Your Application</h2>
                <div className={`application-status-card ${myApplication.status}`}>
                  <div className="status-header">
                    <span className={`status-badge ${myApplication.status}`}>
                      {myApplication.status === 'pending' && '⏳ Pending Review'}
                      {myApplication.status === 'accepted' && '✅ Accepted'}
                      {myApplication.status === 'rejected' && '❌ Rejected'}
                    </span>
                  </div>
                  <div className="application-details">
                    <div className="detail-row">
                      <span>Proposed Price:</span>
                      <strong>{formatCurrency(myApplication.proposedPrice)}</strong>
                    </div>
                    {myApplication.message && (
                      <div className="detail-row">
                        <span>Your Message:</span>
                        <p>{myApplication.message}</p>
                      </div>
                    )}
                    <div className="detail-row">
                      <span>Applied:</span>
                      <span>{formatDate(myApplication.appliedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="job-sidebar">
            <div className="sidebar-card">
              <h3>Job Details</h3>
              <div className="detail-list">
                <div className="detail-item">
                  <Briefcase size={18} />
                  <div>
                    <label>Category</label>
                    <span className="capitalize">{job.category}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <DollarSign size={18} />
                  <div>
                    <label>Budget</label>
                    <span>{formatCurrency(job.budget)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Calendar size={18} />
                  <div>
                    <label>Deadline</label>
                    <span>{formatDate(job.deadline)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Clock size={18} />
                  <div>
                    <label>Status</label>
                    <span className="capitalize">{job.status.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {isAuthenticated && user?.role === 'photographer' && !myApplication && job.status === 'open' && (
              <div className="sidebar-card">
                <button className="btn btn-primary btn-block" onClick={handleApply}>
                  <Send size={18} />
                  Apply for this Job
                </button>
              </div>
            )}

            {!isAuthenticated && job.status === 'open' && (
              <div className="sidebar-card">
                <p className="login-prompt">Login to apply for this job</p>
                <Link to="/login" className="btn btn-primary btn-block">
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              className="modal-content apply-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Apply for "{job.title}"</h2>
                <button onClick={() => setShowApplyModal(false)}>
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitApplication}>
                <div className="form-group">
                  <label>Your Proposed Price (USD) *</label>
                  <input
                    type="number"
                    value={applyFormData.proposedPrice}
                    onChange={(e) => setApplyFormData(prev => ({ ...prev, proposedPrice: e.target.value }))}
                    placeholder={job.budget.toString()}
                    min="0"
                    step="0.01"
                    required
                  />
                  <small>You can propose your own price or match the employer's budget</small>
                </div>
                <div className="form-group">
                  <label>Message (optional)</label>
                  <textarea
                    value={applyFormData.message}
                    onChange={(e) => setApplyFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell the employer why you're the right fit for this job..."
                    rows={4}
                    maxLength={1000}
                  />
                  <small>{applyFormData.message.length}/1000 characters</small>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowApplyModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={18} className="spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobDetail;

