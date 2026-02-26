import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Trophy, Clock, ArrowRight, Plus, Users } from 'lucide-react';
import { TOURNAMENT_CATEGORIES } from '../config/api.config';
import { tournamentAPI, getImageUrl } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import './Tournaments.css';

const Tournaments = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};

      // Map tab to status query
      if (activeTab === 'live') {
        params.status = 'live';
      } else if (activeTab === 'upcoming') {
        params.status = 'upcoming';
      } else if (activeTab === 'past') {
        params.status = 'completed';
      }

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      params.limit = 50;

      const response = await tournamentAPI.getAll(params);

      if (response.data.success) {
        let fetched = response.data.data.tournaments || [];

        // Client-side search filtering
        if (searchQuery) {
          fetched = fetched.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setTournaments(fetched);
      } else {
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to load tournaments');
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registration':
        return <span className="badge badge-live">Registration Open</span>;
      case 'live':
        return <span className="badge badge-live">Live</span>;
      case 'voting':
        return <span className="badge badge-voting">Voting</span>;
      case 'upcoming':
        return <span className="badge">Upcoming</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getCoverImage = (tournament) => {
    if (tournament.coverImage) {
      // Check if it's a full URL or a local path
      if (tournament.coverImage.startsWith('http')) {
        return tournament.coverImage;
      }
      return getImageUrl(tournament.coverImage);
    }
    // Default cover images by category
    const defaults = {
      abstract: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
      portrait: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
      landscape: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      street: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      nature: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      architecture: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800',
      fashion: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      sports: 'https://images.unsplash.com/photo-1461896836934-bd45ba0c0b70?w=800',
      wildlife: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800',
      macro: 'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=800',
      cyberpunk: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      character: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      other: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    };
    return defaults[tournament.category] || defaults.other;
  };

  return (
    <div className="tournaments-page">
      <div className="container">
        {/* Page Header */}
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Tournaments</h1>
          <p className="text-secondary">
            Compete in photography tournaments and showcase your talent
          </p>
          {isAuthenticated && isAdmin() && (
            <Link to="/admin/tournaments/create" className="btn btn-primary create-tournament-header-btn">
              <Plus size={18} />
              Create Tournament
            </Link>
          )}
        </motion.div>

        {/* Filters Section */}
        <div className="filters-section">
          {/* Status Tabs */}
          <div className="status-tabs">
            {['live', 'upcoming', 'past'].map(tab => (
              <button
                key={tab}
                className={`status-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'live' && <span className="live-dot"></span>}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="filter-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-filter">
              <Filter size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {TOURNAMENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="tournaments-loading">
            <div className="spinner"></div>
            <p>Loading tournaments...</p>
          </div>
        ) : (
          /* Tournament Grid */
          <div className="tournaments-grid">
            {tournaments.length > 0 ? (
              tournaments.map((tournament, index) => (
                <motion.div
                  key={tournament._id}
                  className="tournament-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/tournaments/${tournament._id}`}>
                    <div className="card-image">
                      <img src={getCoverImage(tournament)} alt={tournament.title} />
                      <div className="card-overlay">
                        {getStatusBadge(tournament.status)}
                        {tournament.isHot && <span className="badge badge-hot">HOT</span>}
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="card-header-info">
                        <h3>{tournament.title}</h3>
                        <span className="category-tag">{tournament.category}</span>
                      </div>

                      {tournament.description && (
                        <p className="card-description">
                          {tournament.description.length > 100
                            ? tournament.description.substring(0, 100) + '...'
                            : tournament.description}
                        </p>
                      )}

                      <div className="card-meta">
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>
                            {tournament.status === 'upcoming'
                              ? `Starts ${formatDate(tournament.registrationStart)}`
                              : tournament.status === 'completed'
                                ? `Ended ${formatDate(tournament.votingEnd)}`
                                : `Ends ${formatDate(tournament.registrationEnd)}`
                            }
                          </span>
                        </div>
                        <div className="meta-item">
                          <Users size={14} />
                          <span>
                            {tournament.stats?.totalParticipants || 0}/{tournament.maxParticipants || 500}
                          </span>
                        </div>
                      </div>

                      <div className="card-stats">
                        {tournament.prizes && (
                          <div className="card-stat">
                            <span className="stat-value prize">
                              {tournament.prizes.points} pts
                            </span>
                            <span className="stat-label">winner prize</span>
                          </div>
                        )}
                        <div className="card-stat">
                          <span className="stat-value">
                            {tournament.stats?.totalViews?.toLocaleString() || 0}
                          </span>
                          <span className="stat-label">views</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="view-link">
                        View Details <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="empty-state">
                <Trophy size={64} className="empty-icon" />
                <h3>No tournaments found</h3>
                <p>
                  {activeTab === 'live'
                    ? 'No active tournaments right now. Check back soon!'
                    : activeTab === 'upcoming'
                      ? 'No upcoming tournaments scheduled yet.'
                      : 'No completed tournaments found.'}
                </p>
                {isAuthenticated && isAdmin() && (
                  <Link to="/admin/tournaments/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    <Plus size={18} />
                    Create First Tournament
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
