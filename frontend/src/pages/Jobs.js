import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, getImageUrl } from '../services/api.service';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Send,
  Loader,
  Eye,
  MessageCircle
} from 'lucide-react';
import './Jobs.css';

const Jobs = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyFormData, setApplyFormData] = useState({
    proposedPrice: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'event', label: 'Event' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'food', label: 'Food' },
    { value: 'sports', label: 'Sports' },
    { value: 'travel', label: 'Travel' },
    { value: 'other', label: 'Other' }
  ];

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        status: 'open',
        sort: '-createdAt'
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (selectedCity) {
        params.city = selectedCity;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await jobAPI.getAll(params);
      if (response.data.success) {
        setJobs(response.data.data.jobs);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load jobs');
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedCategory, selectedCity, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApply = (job) => {
    if (!isAuthenticated) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }
    if (user?.role !== 'photographer') {
      toast.error('Only photographers can apply for jobs');
      return;
    }
    setSelectedJob(job);
    setApplyFormData({
      proposedPrice: job.budget.toString(),
      message: ''
    });
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await jobAPI.apply(selectedJob._id, {
        proposedPrice: parseFloat(applyFormData.proposedPrice),
        message: applyFormData.message
      });

      if (response.data.success) {
        toast.success('Application submitted successfully!');
        setShowApplyModal(false);
        setSelectedJob(null);
        fetchJobs();
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
      month: 'short',
      year: 'numeric'
    });
  };

  const hasApplied = (job) => {
    if (!isAuthenticated || !user) return false;
    // Check if current user has applied (this would need to be checked from job detail)
    return false; // Simplified - would need to fetch job detail to check
  };

  return (
    <div className="jobs-page">
      <div className="container">
        {/* Page Header */}
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>Find Work</h1>
            <p className="text-secondary">
              Browse photography jobs and apply to work with clients
            </p>
          </div>
        </motion.div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters-row">
            <div className="filter-group">
              <Filter size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <MapPin size={18} />
              <input
                type="text"
                placeholder="City (optional)"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="loading-state">
            <Loader size={32} className="spin" />
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={48} />
            <h3>No jobs found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <>
            <div className="jobs-grid">
              {jobs.map((job) => (
                <motion.div
                  key={job._id}
                  className="job-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="job-card-header">
                    <div>
                      <h3>{job.title}</h3>
                      <span className="job-category">{job.category}</span>
                    </div>
                  </div>
                  <p className="job-description">
                    {job.description.substring(0, 150)}...
                  </p>
                  <div className="job-details">
                    <div className="detail-item">
                      <DollarSign size={16} />
                      <span className="budget">
                        {formatCurrency(job.budget)}
                        {job.budgetType === 'negotiable' && (
                          <span className="negotiable"> (negotiable)</span>
                        )}
                      </span>
                    </div>
                    {job.location?.city && (
                      <div className="detail-item">
                        <MapPin size={16} />
                        <span>{job.location.city}, {job.location.country}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>Deadline: {formatDate(job.deadline)}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>Posted {formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div className="job-tags">
                      {job.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="job-card-actions">
                    <Link to={`/jobs/${job._id}`} className="btn btn-outline btn-sm">
                      <Eye size={16} />
                      View Details
                    </Link>
                    {isAuthenticated && user?.role === 'photographer' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApply(job)}
                        disabled={hasApplied(job)}
                      >
                        {hasApplied(job) ? (
                          <>
                            <CheckCircle size={16} />
                            Applied
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Apply
                          </>
                        )}
                      </button>
                    )}
                    {!isAuthenticated && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          toast.error('Please login to apply for jobs');
                          navigate('/login');
                        }}
                      >
                        <Send size={16} />
                        Apply
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={currentPage >= pagination.pages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && selectedJob && (
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
                <h2>Apply for "{selectedJob.title}"</h2>
                <button onClick={() => setShowApplyModal(false)}>
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitApplication}>
                <div className="job-preview">
                  <div className="preview-item">
                    <DollarSign size={18} />
                    <div>
                      <label>Job Budget</label>
                      <span>{formatCurrency(selectedJob.budget)} {selectedJob.budgetType === 'negotiable' && '(negotiable)'}</span>
                    </div>
                  </div>
                  {selectedJob.location?.city && (
                    <div className="preview-item">
                      <MapPin size={18} />
                      <div>
                        <label>Location</label>
                        <span>{selectedJob.location.city}, {selectedJob.location.country}</span>
                      </div>
                    </div>
                  )}
                  <div className="preview-item">
                    <Calendar size={18} />
                    <div>
                      <label>Deadline</label>
                      <span>{formatDate(selectedJob.deadline)}</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Proposed Price (USD) *</label>
                  <input
                    type="number"
                    value={applyFormData.proposedPrice}
                    onChange={(e) => setApplyFormData(prev => ({ ...prev, proposedPrice: e.target.value }))}
                    placeholder={selectedJob.budget.toString()}
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

export default Jobs;

