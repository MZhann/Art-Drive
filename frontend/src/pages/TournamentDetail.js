import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI, getImageUrl } from '../services/api.service';
import { toast } from 'react-hot-toast';
import { 
  Trophy, 
  Heart, 
  Calendar,
  Award,
  ArrowLeft,
  Users,
  FileText,
  Star,
  Newspaper,
  UploadCloud,
  X,
  CheckCircle
} from 'lucide-react';
import './TournamentDetail.css';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchTournament = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await tournamentAPI.getById(id);
      if (response.data.success) {
        setTournament(response.data.data.tournament);
      } else {
        toast.error('Tournament not found');
        setTournament(null);
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast.error('Failed to load tournament');
      setTournament(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  // Countdown timer
  useEffect(() => {
    if (!tournament) return;

    const getTargetDate = () => {
      const status = tournament.status;
      if (status === 'upcoming') return new Date(tournament.registrationStart);
      if (status === 'registration') return new Date(tournament.registrationEnd);
      if (status === 'live') return new Date(tournament.votingStart);
      if (status === 'voting') return new Date(tournament.votingEnd);
      return null;
    };

    const updateCountdown = () => {
      const target = getTargetDate();
      if (!target) return;

      const now = new Date();
      const diff = target - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const getCountdownLabel = () => {
    if (!tournament) return '';
    switch (tournament.status) {
      case 'upcoming': return 'Registration opens in:';
      case 'registration': return 'Registration ends in:';
      case 'live': return 'Voting starts in:';
      case 'voting': return 'Voting ends in:';
      case 'completed': return 'Tournament completed';
      default: return '';
    }
  };

  // Check if current user is already registered
  const isUserRegistered = () => {
    if (!isAuthenticated || !user || !tournament?.participants) return false;
    const userId = user.id || user._id;
    return tournament.participants.some(
      p => (p.user?._id || p.user) === userId
    );
  };

  const handleVote = async (participantId) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    try {
      const response = await tournamentAPI.vote(id, participantId);
      if (response.data.success) {
        toast.success('Vote recorded!');
        fetchTournament();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to vote');
    }
  };

  const openRegisterModal = () => {
    if (!isAuthenticated) {
      toast.error('Please login to register');
      navigate('/login');
      return;
    }
    if (user?.role !== 'photographer') {
      toast.error('Only photographers can register for tournaments');
      return;
    }
    if (isUserRegistered()) {
      toast.error('You are already registered for this tournament');
      return;
    }
    setShowRegisterModal(true);
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoTitle('');
    setPhotoDescription('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be under 10MB');
        return;
      }
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a photo to submit');
      return;
    }

    setIsRegistering(true);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('photoTitle', photoTitle || '');
      formData.append('photoDescription', photoDescription || '');

      const response = await tournamentAPI.register(id, formData);

      if (response.data.success) {
        toast.success('Successfully registered for the tournament!');
        closeRegisterModal();
        fetchTournament(); // Refresh to show updated participant list
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to register for tournament');
    } finally {
      setIsRegistering(false);
    }
  };

  const getCoverImage = () => {
    if (tournament?.coverImage) {
      if (tournament.coverImage.startsWith('http')) return tournament.coverImage;
      return getImageUrl(tournament.coverImage);
    }
    const defaults = {
      abstract: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200',
      portrait: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200',
      landscape: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
      street: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200',
      nature: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
      cyberpunk: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      character: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200',
    };
    return defaults[tournament?.category] || defaults.abstract;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="not-found">
        <h2>Tournament not found</h2>
        <Link to="/tournaments" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const userRegistered = isUserRegistered();

  return (
    <div className="tournament-detail-page">
      {/* Hero Section */}
      <div className="tournament-hero">
        <div className="hero-image">
          <img src={getCoverImage()} alt={tournament.title} />
          <div className="hero-overlay"></div>
        </div>
        
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/tournaments" className="back-link">
              <ArrowLeft size={18} />
              Back to Tournaments
            </Link>

            <div className="tournament-badges">
              {tournament.isHot && <span className="badge badge-hot">HOT</span>}
              {(tournament.status === 'registration' || tournament.status === 'live' || tournament.status === 'voting') && (
                <span className="badge badge-live">
                  {tournament.status === 'registration' ? 'Registration Open' : tournament.status === 'voting' ? 'Voting' : 'Live'}
                </span>
              )}
              <span className="category-tag-hero">{tournament.category}</span>
            </div>

            <h1 className="tournament-title">
              {tournament.title}
            </h1>

            <p className="tournament-description">{tournament.description}</p>

            {/* Countdown */}
            {tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
              <div className="countdown-section">
                <p className="countdown-label">{getCountdownLabel()}</p>
                <div className="countdown-timer large">
                  {countdown.days > 0 && (
                    <>
                      <div className="countdown-item">
                        <span className="countdown-value">{countdown.days.toString().padStart(2, '0')}</span>
                        <span className="countdown-unit">days</span>
                      </div>
                      <div className="countdown-separator">:</div>
                    </>
                  )}
                  <div className="countdown-item">
                    <span className="countdown-value">{countdown.hours.toString().padStart(2, '0')}</span>
                    <span className="countdown-unit">hours</span>
                  </div>
                  <div className="countdown-separator">:</div>
                  <div className="countdown-item">
                    <span className="countdown-value">{countdown.minutes.toString().padStart(2, '0')}</span>
                    <span className="countdown-unit">min</span>
                  </div>
                  <div className="countdown-separator">:</div>
                  <div className="countdown-item">
                    <span className="countdown-value">{countdown.seconds.toString().padStart(2, '0')}</span>
                    <span className="countdown-unit">sec</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="hero-actions">
              {tournament.status === 'registration' && (
                <>
                  {userRegistered ? (
                    <button className="btn btn-success btn-lg" disabled>
                      <CheckCircle size={20} />
                      You're Registered!
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={openRegisterModal}>
                      <Trophy size={20} />
                      Register as Contestant
                    </button>
                  )}
                  {isAdmin() && (
                    <button
                      className="btn btn-outline btn-lg"
                      onClick={async () => {
                        try {
                          const res = await tournamentAPI.start(id);
                          if (res.data.success) {
                            toast.success('Tournament started!');
                            fetchTournament();
                          }
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to start');
                        }
                      }}
                    >
                      <Trophy size={20} />
                      Start Tournament
                    </button>
                  )}
                </>
              )}
              {(tournament.status === 'voting' || tournament.status === 'live') && (
                <Link to={`/tournaments/${id}/vote`} className="btn btn-primary btn-lg">
                  <Heart size={20} />
                  Join Tournament
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Tournament Info */}
        <div className="tournament-info-grid">
          {/* Stats */}
          <motion.div 
            className="info-card stats-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Tournament Stats</h3>
            <div className="stats-grid">
              <div className="stat-block">
                <span className="stat-value large">
                  <Users size={18} />
                  {tournament.stats?.totalParticipants || 0}/{tournament.maxParticipants}
                </span>
                <span className="stat-label">Participants</span>
              </div>
              <div className="stat-block">
                <span className="stat-value large">
                  {(tournament.stats?.totalViews || 0).toLocaleString()}
                </span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-block">
                <span className="stat-value large">
                  {(tournament.stats?.totalVotes || 0).toLocaleString()}
                </span>
                <span className="stat-label">Total Votes</span>
              </div>
            </div>
          </motion.div>

          {/* Prizes */}
          <motion.div 
            className="info-card prizes-info-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3>
              <Award size={20} />
              Winner Prizes
            </h3>
            <div className="prizes-list">
              <div className="prize-item">
                <Star size={18} className="prize-icon-star" />
                <span>{tournament.prizes?.points || 10} Points</span>
              </div>
              <div className="prize-item">
                <span className="prize-badge-emoji">{tournament.prizes?.badge?.icon || '🏆'}</span>
                <span>{tournament.prizes?.badge?.name || 'Winner Badge'}</span>
              </div>
              <div className="prize-item">
                <Newspaper size={18} className="prize-icon-news" />
                <span>{tournament.prizes?.newsPageDays || 2} Days in News Page</span>
              </div>
              {tournament.prizes?.additionalPrizes && (
                <div className="prize-item additional">
                  <Award size={18} />
                  <span>{tournament.prizes.additionalPrizes}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div 
            className="info-card timeline-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>
              <Calendar size={20} />
              Timeline
            </h3>
            <div className="timeline">
              <div className={`timeline-item ${['registration', 'live', 'voting', 'completed'].includes(tournament.status) ? 'active' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Registration</span>
                  <span className="timeline-date">{formatDate(tournament.registrationStart)} - {formatDate(tournament.registrationEnd)}</span>
                </div>
              </div>
              <div className={`timeline-item ${['voting', 'completed'].includes(tournament.status) ? 'active' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Voting</span>
                  <span className="timeline-date">{formatDate(tournament.votingStart)} - {formatDate(tournament.votingEnd)}</span>
                </div>
              </div>
              <div className={`timeline-item ${tournament.status === 'completed' ? 'active' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Results</span>
                  <span className="timeline-date">After {formatDate(tournament.votingEnd)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Rules Section */}
        {tournament.rules && (
          <motion.div 
            className="rules-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2>
              <FileText size={24} />
              Rules &amp; Guidelines
            </h2>
            <div className="rules-content">
              {tournament.rules.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        {tournament.participants && tournament.participants.length > 0 && (
          <motion.div 
            className="leaderboard-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <h2>
                <Trophy size={24} />
                Leaderboard
              </h2>
              <span className="total-votes">{(tournament.stats?.totalVotes || 0).toLocaleString()} total votes</span>
            </div>

            <div className="leaderboard-grid">
              {[...tournament.participants]
                .sort((a, b) => b.votes - a.votes)
                .map((participant, index) => (
                <motion.div 
                  key={participant._id}
                  className={`leaderboard-card ${index < 3 ? 'top-three' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="rank-badge">#{index + 1}</div>
                  <div className="participant-photo">
                    {participant.photo?.url ? (
                      <img src={participant.photo.url.startsWith('http') ? participant.photo.url : getImageUrl(participant.photo.url)} alt={participant.user?.fullName || 'Participant'} />
                    ) : (
                      <div className="no-photo">
                        <Trophy size={24} />
                      </div>
                    )}
                  </div>
                  <div className="participant-info">
                    <span className="participant-name">{participant.user?.fullName || 'Anonymous'}</span>
                    <span className="participant-username">@{participant.user?.username || 'unknown'}</span>
                  </div>
                  <div className="vote-section">
                    <span className="vote-count">
                      <Heart size={16} />
                      {(participant.votes || 0).toLocaleString()}
                    </span>
                    {(tournament.status === 'voting' || tournament.status === 'live') && (
                      <button 
                        className="vote-btn"
                        onClick={() => handleVote(participant._id)}
                      >
                        Vote
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty leaderboard state */}
        {(!tournament.participants || tournament.participants.length === 0) && (
          <motion.div 
            className="leaderboard-section empty-leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <h2>
                <Trophy size={24} />
                Participants
              </h2>
            </div>
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <p>No participants yet. Be the first to register!</p>
              {tournament.status === 'registration' && !userRegistered && (
                <button className="btn btn-primary" onClick={openRegisterModal} style={{ marginTop: '1rem' }}>
                  <Trophy size={18} />
                  Register Now
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="register-modal-overlay" onClick={closeRegisterModal}>
          <motion.div 
            className="register-modal"
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="register-modal-header">
              <div>
                <h2>Register for Tournament</h2>
                <p className="text-secondary">{tournament.title}</p>
              </div>
              <button className="close-btn" onClick={closeRegisterModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="register-form">
              {/* Photo Upload */}
              <div className="form-group">
                <label>Upload Your Photo *</label>
                <div 
                  className={`photo-upload-area ${previewUrl ? 'has-preview' : ''}`}
                  onClick={() => document.getElementById('tournament-photo-input').click()}
                >
                  {previewUrl ? (
                    <div className="photo-preview">
                      <img src={previewUrl} alt="Preview" />
                      <div className="photo-preview-overlay">
                        <UploadCloud size={24} />
                        <span>Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <UploadCloud size={40} />
                      <span className="upload-text">Click to upload your photo</span>
                      <span className="upload-hint">JPEG, PNG, WebP or GIF — Max 10MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="tournament-photo-input"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Photo Title */}
              <div className="form-group">
                <label htmlFor="reg-photo-title">Photo Title (optional)</label>
                <input
                  type="text"
                  id="reg-photo-title"
                  className="form-input"
                  placeholder="Give your photo a title..."
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Photo Description */}
              <div className="form-group">
                <label htmlFor="reg-photo-desc">Description (optional)</label>
                <textarea
                  id="reg-photo-desc"
                  className="form-input"
                  placeholder="Tell us about your photo..."
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Prize info reminder */}
              <div className="register-prize-reminder">
                <h4>
                  <Award size={16} />
                  Winner Prizes
                </h4>
                <div className="prize-reminder-items">
                  <span><Star size={14} /> {tournament.prizes?.points || 10} Points</span>
                  <span>{tournament.prizes?.badge?.icon || '🏆'} {tournament.prizes?.badge?.name || 'Winner Badge'}</span>
                  <span><Newspaper size={14} /> {tournament.prizes?.newsPageDays || 2} Days in News</span>
                </div>
              </div>

              {/* Submit */}
              <div className="register-form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeRegisterModal}
                  disabled={isRegistering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedFile || isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <div className="btn-spinner"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <Trophy size={18} />
                      Submit &amp; Register
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
