import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI, getImageUrl } from '../services/api.service';
import { useTournamentSocket } from '../hooks/useTournamentSocket';
import { toast } from 'react-hot-toast';
import {
  Heart,
  X,
  ArrowLeft,
  Trophy,
  Maximize2,
  Share2,
  Star,
  User,
} from 'lucide-react';
import './TournamentVoting.css';

const TournamentVoting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myParticipantVotes, setMyParticipantVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await tournamentAPI.getVoteProgress(id);
      if (res.data.success) {
        setProgress(res.data.data);
        setMyParticipantVotes(res.data.data.myParticipantVotes || 0);
      }
    } catch (err) {
      console.error('Vote progress error:', err);
      toast.error('Failed to load voting');
      navigate(`/tournaments/${id}`);
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      navigate('/login');
      return;
    }
    fetchProgress();
  }, [fetchProgress, isAuthenticated, navigate]);

  const handleVoteUpdate = useCallback((data) => {
    if (data.participants && user) {
      const uid = user.id || user._id;
      if (!uid) return;
      const me = data.participants.find(
        (p) => String(p.userId) === String(uid)
      );
      if (me) {
        setMyParticipantVotes(me.votes);
      }
    }
  }, [user]);

  useTournamentSocket(id, handleVoteUpdate);

  const userId = user?.id || user?._id;
  const participants = progress?.participants || [];
  const votedIds = new Set(progress?.votedParticipantIds || []);
  const totalToVote = participants.filter(
    (p) => {
      const pu = p.user?._id || p.user;
      return pu && String(pu) !== String(userId);
    }
  ).length;
  const remaining = participants.filter(
    (p) => {
      const pu = p.user?._id || p.user;
      const isOwn = pu && String(pu) === String(userId);
      if (isOwn) return false;
      return !votedIds.has(String(p._id));
    }
  );
  const current = remaining[currentIndex];
  const votedCount = totalToVote - remaining.length;
  const progressPercent = totalToVote > 0 ? (votedCount / totalToVote) * 100 : 100;

  const handleLike = async () => {
    if (!current || isVoting) return;
    setIsVoting(true);
    try {
      await tournamentAPI.vote(id, current._id);
      setProgress((prev) => ({
        ...prev,
        votedParticipantIds: [...(prev?.votedParticipantIds || []), String(current._id)],
      }));
      setCurrentIndex(0);
      toast.success('Liked!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDislike = async () => {
    if (!current || isVoting) return;
    setIsVoting(true);
    try {
      await tournamentAPI.skip(id, current._id);
      setProgress((prev) => ({
        ...prev,
        votedParticipantIds: [...(prev?.votedParticipantIds || []), String(current._id)],
      }));
      setCurrentIndex(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to skip');
    } finally {
      setIsVoting(false);
    }
  };

  const getImageSrc = (photo) => {
    if (!photo?.url) return null;
    return photo.url.startsWith('http') ? photo.url : getImageUrl(photo.url);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="tournament-voting-page">
        <div className="voting-loading">
          <div className="spinner"></div>
          <p>Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!progress || (progress.tournament?.status !== 'voting' && progress.tournament?.status !== 'live')) {
    return (
      <div className="tournament-voting-page">
        <div className="voting-not-available">
          <p>Voting is not open for this tournament.</p>
          <Link to={`/tournaments/${id}`} className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Tournament
          </Link>
        </div>
      </div>
    );
  }

  if (remaining.length === 0 && votedCount === 0 && totalToVote === 0) {
    return (
      <div className="tournament-voting-page">
        <div className="voting-not-available">
          <p>No images to vote on yet.</p>
          <Link to={`/tournaments/${id}`} className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Tournament
          </Link>
        </div>
      </div>
    );
  }

  if (remaining.length === 0 && votedCount > 0) {
    return (
      <div className="tournament-voting-page">
        <div className="voting-complete">
          <Trophy size={48} className="complete-icon" />
          <h2>All caught up!</h2>
          <p>You've voted on all images. Thanks for participating!</p>
          <Link to={`/tournaments/${id}`} className="btn btn-primary">
            <ArrowLeft size={18} />
            View Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-voting-page">
      <div className="voting-header">
        <Link to={`/tournaments/${id}`} className="voting-back">
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 className="voting-title">{progress?.tournament?.title || 'Tournament'}</h1>
        <div className="voting-header-right">
          {progress?.myParticipantVotes !== undefined && progress.myParticipantVotes > 0 && (
            <div className="my-likes-badge">
              <Heart size={18} fill="currentColor" className="heart-filled" />
              <span>{myParticipantVotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* My image likes - real-time (for participants only) */}
      {progress?.isParticipant && (
        <div className="my-likes-banner">
          <div className="my-likes-content">
            <Trophy size={24} className="trophy-icon" />
            <span>Likes my image got</span>
          </div>
          <div className="my-likes-count">
            <Heart size={20} fill="var(--color-accent-green)" />
            <span>{myParticipantVotes}</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="voting-progress-section">
        <div className="voting-progress-bar">
          <div
            className="voting-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="voting-progress-label">
          {votedCount} / {totalToVote} images
        </span>
      </div>

      {/* Current image */}
      <div className="voting-image-container">
        <div className="voting-round-badge">
          Round 1
          <span className="round-remaining">{remaining.length}Q</span>
        </div>
        <button
          className="voting-fullscreen-btn"
          onClick={() => setFullscreenImage(current)}
          title="View fullscreen"
        >
          <Maximize2 size={20} />
        </button>

        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current._id}
              className="voting-current-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="voting-image-wrapper"
                onClick={() => setFullscreenImage(current)}
              >
                <img
                  src={getImageSrc(current.photo) || '/placeholder.png'}
                  alt={current.photo?.title || 'Submission'}
                />
              </div>
              <p className="voting-image-title">{current.photo?.title || 'Untitled'}</p>
              <div className="voting-image-actions">
                <button className="voting-icon-btn" title="Share">
                  <Share2 size={18} />
                </button>
                <button className="voting-icon-btn" title="Favorite">
                  <Star size={18} />
                </button>
                <button
                  className="voting-icon-btn"
                  title="View artist"
                  onClick={() =>
                    current.user?.username &&
                    navigate(`/profile/${current.user.username}`)
                  }
                >
                  <User size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Like / Dislike buttons */}
      <div className="voting-buttons">
        <button
          className="voting-btn voting-btn-dislike"
          onClick={handleDislike}
          disabled={isVoting}
          title="Dislike / Skip"
        >
          <X size={32} />
        </button>
        <button
          className="voting-btn voting-btn-like"
          onClick={handleLike}
          disabled={isVoting}
          title="Like"
        >
          <Heart size={32} />
        </button>
      </div>

      {/* Fullscreen modal */}
      {fullscreenImage && (
        <div
          className="voting-fullscreen-overlay"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="voting-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageSrc(fullscreenImage.photo) || '/placeholder.png'}
              alt={fullscreenImage.photo?.title || 'Submission'}
            />
            <p className="voting-fullscreen-title">{fullscreenImage.photo?.title || 'Untitled'}</p>
            <button
              className="voting-fullscreen-close"
              onClick={() => setFullscreenImage(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentVoting;
