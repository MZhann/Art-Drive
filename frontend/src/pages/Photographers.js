import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Star, 
  Trophy, 
  Camera, 
  Heart,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userAPI, getImageUrl } from '../services/api.service';
import './Photographers.css';

const Photographers = () => {
  const [photographers, setPhotographers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-points');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });

  const fetchPhotographers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await userAPI.getPhotographers(params);
      if (response.data.success) {
        setPhotographers(response.data.data.photographers);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Failed to fetch photographers:', error);
      setPhotographers([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, searchQuery]);

  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination(prev => ({ ...prev, page }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="photographers-page">
      <div className="container">
        {/* Page Header */}
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Photographers</h1>
          <p className="text-secondary">
            Discover talented photographers from around the world
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="photographers-filters"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="sort-filter">
            <Filter size={18} />
            <select value={sortBy} onChange={handleSortChange}>
              <option value="-points">Most Points</option>
              <option value="-stats.tournamentsWon">Most Wins</option>
              <option value="-stats.tournamentsJoined">Most Active</option>
              <option value="-createdAt">Newest</option>
              <option value="fullName">Name A-Z</option>
            </select>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div 
          className="photographers-stats-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="results-count">
            <Users size={16} />
            {pagination.total} photographer{pagination.total !== 1 ? 's' : ''} found
          </span>
        </motion.div>

        {/* Loading */}
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : photographers.length > 0 ? (
          <>
            {/* Grid */}
            <div className="photographers-grid">
              {photographers.map((photographer, index) => (
                <motion.div
                  key={photographer._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    to={`/profile/${photographer.username}`} 
                    className="photographer-card"
                  >
                    <div className="photographer-card-header">
                      <div className="photographer-avatar">
                        {photographer.avatar ? (
                          <img src={getImageUrl(photographer.avatar)} alt={photographer.fullName} />
                        ) : (
                          <span className="avatar-placeholder">
                            {photographer.fullName?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div className="photographer-level">
                        <Star size={12} />
                        Lvl {photographer.level || 1}
                      </div>
                    </div>

                    <div className="photographer-card-body">
                      <h3 className="photographer-name">{photographer.fullName}</h3>
                      <p className="photographer-username">@{photographer.username}</p>
                      
                      {photographer.bio && (
                        <p className="photographer-bio">{photographer.bio}</p>
                      )}

                      {photographer.location?.city && (
                        <p className="photographer-location">
                          <MapPin size={14} />
                          {photographer.location.city}{photographer.location.country ? `, ${photographer.location.country}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="photographer-card-stats">
                      <div className="card-stat">
                        <Trophy size={14} />
                        <span className="stat-val">{photographer.stats?.tournamentsWon || 0}</span>
                        <span className="stat-lbl">Wins</span>
                      </div>
                      <div className="card-stat">
                        <Camera size={14} />
                        <span className="stat-val">{photographer.stats?.totalPhotosUploaded || 0}</span>
                        <span className="stat-lbl">Photos</span>
                      </div>
                      <div className="card-stat">
                        <Heart size={14} />
                        <span className="stat-val">{(photographer.stats?.totalVotesReceived || 0).toLocaleString()}</span>
                        <span className="stat-lbl">Votes</span>
                      </div>
                    </div>

                    <div className="photographer-card-footer">
                      <span className="points-badge">
                        <Star size={14} />
                        {(photographer.points || 0).toLocaleString()} pts
                      </span>
                      {photographer.badges && photographer.badges.length > 0 && (
                        <div className="mini-badges">
                          {photographer.badges.slice(0, 3).map((badge, i) => (
                            <span key={i} className="mini-badge" title={badge.name}>
                              {badge.icon}
                            </span>
                          ))}
                          {photographer.badges.length > 3 && (
                            <span className="mini-badge more">+{photographer.badges.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 7) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 4) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 3) {
                    pageNum = pagination.pages - 6 + i;
                  } else {
                    pageNum = pagination.page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="pagination-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Camera size={64} className="empty-icon" />
            <h3>No photographers found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Photographers;

