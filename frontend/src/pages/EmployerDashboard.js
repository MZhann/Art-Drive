import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, userAPI, getImageUrl } from '../services/api.service';
import {
  Briefcase,
  Plus,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageCircle,
  Loader,
  ArrowLeft,
  User,
  Award,
  Star
} from 'lucide-react';
import './EmployerDashboard.css';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'create', or 'applications'
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    budget: '',
    budgetType: 'negotiable',
    location: {
      city: '',
      country: 'Kazakhstan',
      address: ''
    },
    requirements: '',
    deadline: '',
    tags: [],
    showContactPublicly: false,
    contact: {
      whatsapp: '',
      telegram: ''
    }
  });

  const [tagInput, setTagInput] = useState('');

  const fetchMyJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await jobAPI.getMyJobs({ page: 1, limit: 50 });
      if (response.data.success) {
        setJobs(response.data.data.jobs);
      }
    } catch (error) {
      toast.error('Failed to load your jobs');
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line no-use-before-define
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employer') {
      navigate('/dashboard');
      return;
    }
    // Check if we should open create tab (from query param or state)
    if (location.search.includes('create=true') || location.state?.openCreate) {
      setActiveTab('create');
    }
    // Initialize contact info from user profile
    if (user?.contact) {
      setFormData(prev => ({
        ...prev,
        contact: {
          whatsapp: user.contact.whatsapp || '',
          telegram: user.contact.telegram || ''
        }
      }));
    }
    fetchMyJobs();
  }, [isAuthenticated, user, location, navigate, fetchMyJobs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const jobData = {
        ...formData,
        budget: parseFloat(formData.budget),
        deadline: new Date(formData.deadline).toISOString()
      };

      // Also update user's contact info if provided
      if (formData.contact.whatsapp || formData.contact.telegram) {
        try {
          await userAPI.updateProfile({
            contact: {
              whatsapp: formData.contact.whatsapp || user.contact?.whatsapp || '',
              telegram: formData.contact.telegram || user.contact?.telegram || ''
            }
          });
        } catch (err) {
          console.error('Error updating contact info:', err);
          // Continue with job creation even if contact update fails
        }
      }

      const response = await jobAPI.create(jobData);
      if (response.data.success) {
        toast.success('Job posted successfully!');
        setFormData({
          title: '',
          description: '',
          category: 'other',
          budget: '',
          budgetType: 'negotiable',
          location: { city: '', country: 'Kazakhstan', address: '' },
          requirements: '',
          deadline: '',
          tags: [],
          showContactPublicly: false,
          contact: {
            whatsapp: user?.contact?.whatsapp || '',
            telegram: user?.contact?.telegram || ''
          }
        });
        setActiveTab('jobs');
        fetchMyJobs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create job');
      console.error('Error creating job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewApplications = async (job) => {
    try {
      const response = await jobAPI.getApplications(job._id);
      if (response.data.success) {
        setSelectedJob({ ...job, applications: response.data.data.applications });
        setShowApplicationModal(true);
      }
    } catch (error) {
      toast.error('Failed to load applications');
      console.error('Error fetching applications:', error);
    }
  };

  const handleAcceptApplication = async (jobId, applicationId) => {
    try {
      const response = await jobAPI.updateApplicationStatus(jobId, applicationId, 'accepted');
      if (response.data.success) {
        toast.success('Application accepted! Contact information is now visible to the photographer.');
        fetchMyJobs();
        setShowApplicationModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept application');
    }
  };

  const handleRejectApplication = async (jobId, applicationId) => {
    try {
      const response = await jobAPI.updateApplicationStatus(jobId, applicationId, 'rejected');
      if (response.data.success) {
        toast.success('Application rejected');
        fetchMyJobs();
        if (selectedJob) {
          const updatedApplications = selectedJob.applications.map(app =>
            app._id === applicationId ? { ...app, status: 'rejected' } : app
          );
          setSelectedJob({ ...selectedJob, applications: updatedApplications });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'var(--color-accent-green)';
      case 'in-progress': return 'var(--color-accent-primary)';
      case 'completed': return 'var(--color-accent-yellow)';
      case 'cancelled': return 'var(--color-text-muted)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isAuthenticated || user?.role !== 'employer') {
    return null;
  }

  return (
    <div className="employer-dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <Link to="/dashboard" className="back-link">
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
            <h1>Employer Dashboard</h1>
            <p className="text-secondary">Manage your job postings and applications</p>
          </div>
          <button
            className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(activeTab === 'create' ? 'jobs' : 'create')}
          >
            {activeTab === 'create' ? (
              <>
                <ArrowLeft size={18} />
                View Jobs
              </>
            ) : (
              <>
                <Plus size={18} />
                Post New Job
              </>
            )}
          </button>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase size={18} />
            My Jobs ({jobs.length})
          </button>
          <button
            className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <Users size={18} />
            Applications ({jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0)})
          </button>
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={18} />
            Post Job
          </button>
        </div>

        {activeTab === 'applications' && (
          <div className="applications-section">
            {isLoading ? (
              <div className="loading-state">
                <Loader size={32} className="spin" />
                <p>Loading applications...</p>
              </div>
            ) : (() => {
              const allApplications = jobs.flatMap(job => 
                (job.applications || []).map(app => ({ ...app, jobTitle: job.title, jobId: job._id }))
              );
              
              if (allApplications.length === 0) {
                return (
                  <div className="empty-state">
                    <Users size={48} />
                    <h3>No applications yet</h3>
                    <p>Applications from photographers will appear here</p>
                  </div>
                );
              }

              // Group by status
              const pending = allApplications.filter(app => app.status === 'pending');
              const accepted = allApplications.filter(app => app.status === 'accepted');
              const rejected = allApplications.filter(app => app.status === 'rejected');

              return (
                <div className="applications-view">
                  <div className="applications-stats">
                    <div className="stat-card">
                      <span className="stat-number">{allApplications.length}</span>
                      <span className="stat-label">Total Applications</span>
                    </div>
                    <div className="stat-card pending">
                      <span className="stat-number">{pending.length}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card accepted">
                      <span className="stat-number">{accepted.length}</span>
                      <span className="stat-label">Accepted</span>
                    </div>
                    <div className="stat-card rejected">
                      <span className="stat-number">{rejected.length}</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>

                  <div className="applications-list-full">
                    {allApplications.map((application) => (
                      <div key={`${application.jobId}-${application._id}`} className="application-card-full">
                        <div className="application-job-info">
                          <Briefcase size={16} />
                          <Link to={`/jobs/${application.jobId}`} className="job-link">
                            {application.jobTitle}
                          </Link>
                        </div>
                        <div className="application-header">
                          <div className="photographer-info">
                            <div className="photographer-avatar">
                              {application.photographer?.avatar ? (
                                <img src={getImageUrl(application.photographer.avatar)} alt={application.photographer.fullName} />
                              ) : (
                                <span>{application.photographer?.fullName?.charAt(0) || 'P'}</span>
                              )}
                            </div>
                            <div>
                              <h4>{application.photographer?.fullName}</h4>
                              <p className="photographer-username">@{application.photographer?.username}</p>
                              <div className="photographer-stats">
                                <span>
                                  <Award size={14} />
                                  Level {application.photographer?.level || 1}
                                </span>
                                <span>
                                  <Star size={14} />
                                  {application.photographer?.points || 0} points
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="application-status">
                            <span className={`status-badge ${application.status}`}>
                              {application.status}
                            </span>
                          </div>
                        </div>
                        <div className="application-details">
                          <div className="proposed-price">
                            <DollarSign size={18} />
                            <span className="price-amount">{formatCurrency(application.proposedPrice)}</span>
                          </div>
                          {application.message && (
                            <div className="application-message">
                              <MessageCircle size={16} />
                              <p>{application.message}</p>
                            </div>
                          )}
                          <div className="application-date">
                            <Clock size={14} />
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="application-actions">
                          <Link
                            to={`/profile/${application.photographer?.username}`}
                            target="_blank"
                            className="btn btn-outline btn-sm"
                          >
                            <User size={16} />
                            View Portfolio
                          </Link>
                          <Link
                            to={`/jobs/${application.jobId}`}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye size={16} />
                            View Job
                          </Link>
                          {application.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  const job = jobs.find(j => j._id === application.jobId);
                                  if (job) {
                                    setSelectedJob(job);
                                    setShowApplicationModal(true);
                                    setTimeout(() => {
                                      handleAcceptApplication(application.jobId, application._id);
                                    }, 100);
                                  }
                                }}
                              >
                                <CheckCircle size={16} />
                                Accept
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  const job = jobs.find(j => j._id === application.jobId);
                                  if (job) {
                                    setSelectedJob(job);
                                    setShowApplicationModal(true);
                                    setTimeout(() => {
                                      handleRejectApplication(application.jobId, application._id);
                                    }, 100);
                                  }
                                }}
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-section">
            {isLoading ? (
              <div className="loading-state">
                <Loader size={32} className="spin" />
                <p>Loading your jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={48} />
                <h3>No jobs posted yet</h3>
                <p>Create your first job posting to find talented photographers</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('create')}>
                  <Plus size={18} />
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="jobs-grid">
                {jobs.map((job) => (
                  <motion.div
                    key={job._id}
                    className="job-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="job-card-header">
                      <div>
                        <h3>{job.title}</h3>
                        <span className="job-category">{job.category}</span>
                      </div>
                      <span
                        className="job-status"
                        style={{ color: getStatusColor(job.status) }}
                      >
                        {job.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="job-description">{job.description.substring(0, 150)}...</p>
                    <div className="job-details">
                      <div className="detail-item">
                        <DollarSign size={16} />
                        <span>{formatCurrency(job.budget)} {job.budgetType === 'negotiable' && '(negotiable)'}</span>
                      </div>
                      {job.location.city && (
                        <div className="detail-item">
                          <MapPin size={16} />
                          <span>{job.location.city}, {job.location.country}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <Users size={16} />
                        <span>{job.applications?.length || 0} applications</span>
                      </div>
                    </div>
                    <div className="job-card-actions">
                      <Link to={`/jobs/${job._id}`} className="btn btn-outline btn-sm">
                        <Eye size={16} />
                        View
                      </Link>
                      {job.applications?.length > 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleViewApplications(job)}
                        >
                          <Users size={16} />
                          Applications ({job.applications.length})
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <motion.form
            className="job-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="form-section">
              <h2>Job Details</h2>
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Wedding Photographer Needed"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="commercial">Commercial</option>
                  <option value="fashion">Fashion</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="food">Food</option>
                  <option value="sports">Sports</option>
                  <option value="travel">Travel</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the job requirements, expectations, and details..."
                  rows={6}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Budget & Location</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Budget (USD) *</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Budget Type</label>
                  <select name="budgetType" value={formData.budgetType} onChange={handleChange}>
                    <option value="negotiable">Negotiable</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    placeholder="e.g., Almaty"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    placeholder="Kazakhstan"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Requirements & Deadline</h2>
              <div className="form-group">
                <label>Requirements</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="List any specific requirements, equipment needed, experience level, etc."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Application Deadline *</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tags (optional)</label>
                <div className="tags-input">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleAddTag}>
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map((tag, idx) => (
                      <span key={idx} className="tag">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                          <XCircle size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="showContactPublicly"
                    checked={formData.showContactPublicly}
                    onChange={(e) => setFormData(prev => ({ ...prev, showContactPublicly: e.target.checked }))}
                  />
                  <span>Show my contact information (WhatsApp/Telegram) publicly on this job posting</span>
                </label>
                <small>If enabled, photographers can see your contact info without applying. Otherwise, contacts are only visible after you accept their application.</small>
              </div>
            </div>

            <div className="form-section">
              <h2>Contact Information</h2>
              <p className="section-description">Provide your contact details so photographers can reach you when their application is accepted.</p>
              <div className="form-row">
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="text"
                    name="contact.whatsapp"
                    value={formData.contact.whatsapp}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, whatsapp: e.target.value }
                    }))}
                    placeholder="e.g., +77001234567"
                  />
                  <small>Include country code (e.g., +7 for Kazakhstan)</small>
                </div>
                <div className="form-group">
                  <label>Telegram Username</label>
                  <input
                    type="text"
                    name="contact.telegram"
                    value={formData.contact.telegram}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, telegram: e.target.value }
                    }))}
                    placeholder="e.g., @username or username"
                  />
                  <small>Enter with or without @ symbol</small>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader size={18} className="spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {/* Applications Modal */}
      <AnimatePresence>
        {showApplicationModal && selectedJob && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowApplicationModal(false)}
          >
            <motion.div
              className="modal-content applications-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Applications for "{selectedJob.title}"</h2>
                <button onClick={() => setShowApplicationModal(false)}>
                  <XCircle size={24} />
                </button>
              </div>
              <div className="applications-list">
                {selectedJob.applications?.length === 0 ? (
                  <div className="empty-applications">
                    <Users size={48} />
                    <p>No applications yet</p>
                  </div>
                ) : (
                  selectedJob.applications?.map((application) => (
                    <div key={application._id} className="application-card">
                      <div className="application-header">
                        <div className="photographer-info">
                          <div className="photographer-avatar">
                            {application.photographer?.avatar ? (
                              <img src={getImageUrl(application.photographer.avatar)} alt={application.photographer.fullName} />
                            ) : (
                              <span>{application.photographer?.fullName?.charAt(0) || 'P'}</span>
                            )}
                          </div>
                          <div>
                            <h4>{application.photographer?.fullName}</h4>
                            <p className="photographer-username">@{application.photographer?.username}</p>
                            <div className="photographer-stats">
                              <span>
                                <Award size={14} />
                                Level {application.photographer?.level || 1}
                              </span>
                              <span>
                                <Star size={14} />
                                {application.photographer?.points || 0} points
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="application-status">
                          <span className={`status-badge ${application.status}`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                      <div className="application-details">
                        <div className="proposed-price">
                          <DollarSign size={18} />
                          <span className="price-amount">{formatCurrency(application.proposedPrice)}</span>
                          {application.proposedPrice !== selectedJob.budget && (
                            <span className="price-note">
                              (Your budget: {formatCurrency(selectedJob.budget)})
                            </span>
                          )}
                        </div>
                        {application.message && (
                          <div className="application-message">
                            <MessageCircle size={16} />
                            <p>{application.message}</p>
                          </div>
                        )}
                        <div className="application-date">
                          <Clock size={14} />
                          Applied {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="application-actions">
                        <Link
                          to={`/profile/${application.photographer?.username}`}
                          target="_blank"
                          className="btn btn-outline btn-sm"
                        >
                          <User size={16} />
                          View Portfolio
                        </Link>
                        {application.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAcceptApplication(selectedJob._id, application._id)}
                            >
                              <CheckCircle size={16} />
                              Accept
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRejectApplication(selectedJob._id, application._id)}
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployerDashboard;

