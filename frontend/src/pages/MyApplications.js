import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api.service';
import {
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  User,
  MessageCircle,
  Phone,
  Loader,
  Eye,
  Filter
} from 'lucide-react';
import './MyApplications.css';

const MyApplications = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'photographer') {
      navigate('/dashboard');
      return;
    }
    fetchMyApplications();
  }, [isAuthenticated, user, navigate, fetchMyApplications]);

  const fetchMyApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await jobAPI.getMyApplications();
      if (response.data.success) {
        setApplications(response.data.data.applications || []);
      } else {
        setApplications([]);
      }
    } catch (error) {
      toast.error('Failed to load your applications');
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const openWhatsApp = (phone) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const openTelegram = (username) => {
    const cleanUsername = username.replace('@', '');
    window.open(`https://t.me/${cleanUsername}`, '_blank');
  };

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (!isAuthenticated || user?.role !== 'photographer') {
    return null;
  }

  return (
    <div className="my-applications-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>My Applications</h1>
            <p className="text-secondary">Track your job applications and contact employers</p>
          </div>
        </div>

        {/* Stats */}
        <div className="applications-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card accepted">
            <span className="stat-number">{stats.accepted}</span>
            <span className="stat-label">Accepted</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-number">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>

        {/* Filters */}
        <div className="applications-filters">
          <Filter size={18} />
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            Accepted ({stats.accepted})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="loading-state">
            <Loader size={32} className="spin" />
            <p>Loading your applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={48} />
            <h3>No applications found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't applied for any jobs yet. Start browsing jobs to apply!"
                : `No ${filter} applications found.`}
            </p>
            {filter === 'all' && (
              <Link to="/jobs" className="btn btn-primary">
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((application) => (
              <motion.div
                key={`${application.job._id}-${application._id}`}
                className="application-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="application-card-header">
                  <div>
                    <h3>{application.job.title}</h3>
                    <span className="job-category">{application.job.category}</span>
                  </div>
                  <span className={`status-badge ${application.status}`}>
                    {application.status === 'pending' && '⏳ Pending'}
                    {application.status === 'accepted' && '✅ Accepted'}
                    {application.status === 'rejected' && '❌ Rejected'}
                  </span>
                </div>

                <div className="application-details">
                  <div className="detail-row">
                    <DollarSign size={16} />
                    <span>Proposed: <strong>{formatCurrency(application.proposedPrice)}</strong></span>
                    <span className="job-budget">Job Budget: {formatCurrency(application.job.budget)}</span>
                  </div>
                  {application.job.location?.city && (
                    <div className="detail-row">
                      <MapPin size={16} />
                      <span>{application.job.location.city}, {application.job.location.country}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span>Applied: {formatDate(application.appliedAt)}</span>
                  </div>
                  {application.message && (
                    <div className="application-message">
                      <MessageCircle size={16} />
                      <p>{application.message}</p>
                    </div>
                  )}
                </div>

                {/* Employer Contact - Only visible if accepted */}
                {application.status === 'accepted' && (
                  <div className="contact-section">
                    <h4>Contact Employer</h4>
                    {application.job.employer?.contact && (
                      application.job.employer.contact.whatsapp || application.job.employer.contact.telegram ? (
                        <>
                          <div className="contact-buttons">
                            {application.job.employer.contact.whatsapp && (
                              <button
                                className="contact-btn whatsapp"
                                onClick={() => openWhatsApp(application.job.employer.contact.whatsapp)}
                              >
                                <Phone size={18} />
                                WhatsApp: {application.job.employer.contact.whatsapp}
                              </button>
                            )}
                            {application.job.employer.contact.telegram && (
                              <button
                                className="contact-btn telegram"
                                onClick={() => openTelegram(application.job.employer.contact.telegram)}
                              >
                                <MessageCircle size={18} />
                                Telegram: {application.job.employer.contact.telegram}
                              </button>
                            )}
                          </div>
                          <div className="employer-info">
                            <User size={16} />
                            <span>{application.job.employer.fullName}</span>
                            {application.job.employer.companyName && (
                              <span className="company-name"> • {application.job.employer.companyName}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="no-contact-info">Contact information not available. Please contact the employer through their profile.</p>
                      )
                    )}
                    {!application.job.employer?.contact && (
                      <p className="no-contact-info">Contact information not available. Please contact the employer through their profile.</p>
                    )}
                  </div>
                )}

                <div className="application-actions">
                  <Link to={`/jobs/${application.job._id}`} className="btn btn-outline btn-sm">
                    <Eye size={16} />
                    View Job
                  </Link>
                  <Link to={`/profile/${application.job.employer?.username}`} className="btn btn-outline btn-sm">
                    <User size={16} />
                    View Employer
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;

