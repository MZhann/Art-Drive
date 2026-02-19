import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Trophy, Clock, ArrowRight } from 'lucide-react';
import { TOURNAMENT_CATEGORIES } from '../config/api.config';
import './Tournaments.css';

// Mock tournaments data
const mockTournaments = [
  {
    id: '1',
    title: 'Cyber Punk Art',
    category: 'cyberpunk',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    prizeFund: { amount: 7000, currency: 'USD' },
    stats: { totalViews: 1500, totalParticipants: 234 },
    status: 'live',
    registrationEnd: new Date('2024-04-12')
  },
  {
    id: '2',
    title: 'Abstract Art',
    category: 'abstract',
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    prizeFund: { amount: 15000, currency: 'USD' },
    stats: { totalViews: 500, totalParticipants: 156 },
    status: 'live',
    registrationEnd: new Date('2024-04-12')
  },
  {
    id: '3',
    title: 'Character Art',
    category: 'character',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    prizeFund: { amount: 1000, currency: 'USD' },
    stats: { totalViews: 15000, totalParticipants: 89 },
    status: 'live',
    registrationEnd: new Date('2024-04-12')
  },
  {
    id: '4',
    title: 'Portrait Photography',
    category: 'portrait',
    coverImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    prizeFund: { amount: 5000, currency: 'USD' },
    stats: { totalViews: 3200, totalParticipants: 178 },
    status: 'upcoming',
    registrationStart: new Date('2024-04-20')
  },
  {
    id: '5',
    title: 'Soul of Almaty',
    category: 'street',
    coverImage: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
    prizeFund: { amount: 10000, currency: 'USD' },
    stats: { totalViews: 8900, totalParticipants: 312 },
    status: 'completed',
    registrationEnd: new Date('2024-03-15')
  }
];

const Tournaments = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredTournaments, setFilteredTournaments] = useState([]);

  useEffect(() => {
    let filtered = mockTournaments;

    // Filter by status
    if (activeTab === 'live') {
      filtered = filtered.filter(t => ['registration', 'live', 'voting'].includes(t.status) || t.status === 'live');
    } else if (activeTab === 'upcoming') {
      filtered = filtered.filter(t => t.status === 'upcoming');
    } else if (activeTab === 'past') {
      filtered = filtered.filter(t => t.status === 'completed');
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    setFilteredTournaments(filtered);
  }, [activeTab, searchQuery, selectedCategory]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
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

        {/* Tournament Grid */}
        <div className="tournaments-grid">
          {filteredTournaments.length > 0 ? (
            filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                className="tournament-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/tournaments/${tournament.id}`}>
                  <div className="card-image">
                    <img src={tournament.coverImage} alt={tournament.title} />
                    <div className="card-overlay">
                      {tournament.status === 'live' && (
                        <span className="badge badge-live">Live</span>
                      )}
                      {tournament.status === 'upcoming' && (
                        <span className="badge">Upcoming</span>
                      )}
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-header-info">
                      <h3>{tournament.title}</h3>
                      <span className="category-tag">{tournament.category}</span>
                    </div>

                    <div className="card-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{formatDate(tournament.registrationEnd || tournament.registrationStart)}</span>
                      </div>
                    </div>

                    <div className="card-stats">
                      <div className="card-stat">
                        <span className="stat-value prize">
                          {tournament.prizeFund.amount.toLocaleString()}$
                        </span>
                        <span className="stat-label">prize fund</span>
                      </div>
                      <div className="card-stat">
                        <span className="stat-value">
                          {tournament.stats.totalViews?.toLocaleString() || 0}
                        </span>
                        <span className="stat-label">audience</span>
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
              <p>Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tournaments;

