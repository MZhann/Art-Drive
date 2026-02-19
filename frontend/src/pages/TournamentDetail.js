import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Trophy, 
  Heart, 
  Calendar,
  Award,
  ArrowLeft
} from 'lucide-react';
import './TournamentDetail.css';

// Mock tournament data
const mockTournament = {
  id: '1',
  title: 'Abstract Art',
  description: 'Showcase your creativity in this abstract art photography competition. Push the boundaries of visual expression and compete for amazing prizes.',
  category: 'abstract',
  coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200',
  prizeFund: { amount: 7000, currency: 'USD' },
  sponsorGift: {
    title: 'MIDJOURNEY 1 YEAR SUBSCRIPTION',
    description: 'Premium AI art tool subscription'
  },
  registrationStart: new Date('2024-04-01'),
  registrationEnd: new Date(Date.now() + 18 * 60 * 60 * 1000),
  votingStart: new Date('2024-04-15'),
  votingEnd: new Date('2024-04-20'),
  status: 'registration',
  stats: {
    totalParticipants: 500,
    totalVotes: 12500,
    totalViews: 15000
  },
  isHot: true,
  participants: [
    { id: '1', user: { username: 'alex_photo', fullName: 'Alex Photography', avatar: null }, votes: 1250, photo: { url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400' } },
    { id: '2', user: { username: 'maria_lens', fullName: 'Maria Lens', avatar: null }, votes: 1180, photo: { url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400' } },
    { id: '3', user: { username: 'photo_master', fullName: 'Photo Master', avatar: null }, votes: 980, photo: { url: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400' } },
    { id: '4', user: { username: 'creative_eye', fullName: 'Creative Eye', avatar: null }, votes: 875, photo: { url: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=400' } },
    { id: '5', user: { username: 'art_vision', fullName: 'Art Vision', avatar: null }, votes: 720, photo: { url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400' } }
  ]
};

const TournamentDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTournament(mockTournament);
      setIsLoading(false);
    }, 500);
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!tournament) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(tournament.registrationEnd);
      const diff = target - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const handleVote = (participantId) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    toast.success('Vote recorded!');
  };

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast.error('Please login to register');
      return;
    }
    toast.success('Registration form coming soon!');
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

  return (
    <div className="tournament-detail-page">
      {/* Hero Section */}
      <div className="tournament-hero">
        <div className="hero-image">
          <img src={tournament.coverImage} alt={tournament.title} />
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
              <span className="badge badge-live">Live</span>
            </div>

            <h1 className="tournament-title">
              {tournament.title.split(' ').map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </h1>

            <p className="tournament-description">{tournament.description}</p>

            {/* Countdown */}
            <div className="countdown-section">
              <p className="countdown-label">Registration ends in:</p>
              <div className="countdown-timer large">
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

            {/* Action Buttons */}
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={handleRegister}>
                <Trophy size={20} />
                Register as Contestant
              </button>
              <button className="btn btn-secondary btn-lg" onClick={handleRegister}>
                <Award size={20} />
                Register as Judge
              </button>
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
                <span className="stat-value large green">
                  {tournament.prizeFund.amount.toLocaleString()}$
                </span>
                <span className="stat-label">Prize Fund</span>
              </div>
              <div className="stat-block">
                <span className="stat-value large">
                  {tournament.stats.totalViews.toLocaleString()}
                </span>
                <span className="stat-label">Audience</span>
              </div>
              <div className="stat-block">
                <span className="stat-value large">
                  {tournament.stats.totalParticipants}
                </span>
                <span className="stat-label">Participants</span>
              </div>
            </div>
          </motion.div>

          {/* Sponsor Gift */}
          <motion.div 
            className="info-card sponsor-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hot-badge">HOT</span>
            <h4>{tournament.sponsorGift.title}</h4>
            <p>{tournament.sponsorGift.description}</p>
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
              <div className="timeline-item active">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Registration</span>
                  <span className="timeline-date">Apr 1 - Apr 14</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Voting</span>
                  <span className="timeline-date">Apr 15 - Apr 20</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">Results</span>
                  <span className="timeline-date">Apr 21</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Leaderboard */}
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
            <span className="total-votes">{tournament.stats.totalVotes.toLocaleString()} total votes</span>
          </div>

          <div className="leaderboard-grid">
            {tournament.participants.map((participant, index) => (
              <motion.div 
                key={participant.id}
                className={`leaderboard-card ${index < 3 ? 'top-three' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="rank-badge">#{index + 1}</div>
                <div className="participant-photo">
                  <img src={participant.photo.url} alt={participant.user.fullName} />
                </div>
                <div className="participant-info">
                  <span className="participant-name">{participant.user.fullName}</span>
                  <span className="participant-username">@{participant.user.username}</span>
                </div>
                <div className="vote-section">
                  <span className="vote-count">
                    <Heart size={16} />
                    {participant.votes.toLocaleString()}
                  </span>
                  <button 
                    className="vote-btn"
                    onClick={() => handleVote(participant.id)}
                  >
                    Vote
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TournamentDetail;

