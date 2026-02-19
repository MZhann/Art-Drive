import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Camera, 
  MapPin, 
  Link as LinkIcon, 
  Instagram, 
  Star,
  Trophy,
  Heart,
  Edit,
  Share2,
  Calendar
} from 'lucide-react';
import './Profile.css';

// Mock user data
const mockUser = {
  id: '1',
  username: 'alex_photographer',
  fullName: 'Alex Photography',
  role: 'photographer',
  avatar: null,
  bio: 'Professional photographer based in Almaty. Specializing in abstract art and street photography. Winner of multiple competitions.',
  location: {
    city: 'Almaty',
    country: 'Kazakhstan'
  },
  socialLinks: {
    instagram: 'alex_photo',
    behance: 'alexphoto',
    website: 'alexphoto.com'
  },
  points: 15420,
  level: 8,
  badges: [
    { name: 'Gold Winner', icon: '🏆', description: 'Won a gold medal' },
    { name: 'Rising Star', icon: '⭐', description: 'Reached level 5' },
    { name: 'Popular', icon: '❤️', description: 'Received 1000 votes' },
    { name: 'Veteran', icon: '🎖️', description: 'Joined 10+ tournaments' }
  ],
  stats: {
    tournamentsJoined: 24,
    tournamentsWon: 5,
    totalVotesReceived: 15680,
    totalPhotosUploaded: 89
  },
  portfolio: [
    { id: '1', imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600', title: 'Abstract Flow' },
    { id: '2', imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=600', title: 'Light Waves' },
    { id: '3', imageUrl: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600', title: 'Color Burst' },
    { id: '4', imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600', title: 'Pink Dreams' },
    { id: '5', imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600', title: 'Street Art' },
    { id: '6', imageUrl: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=600', title: 'Urban Life' }
  ],
  createdAt: '2023-01-15'
};

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');

  const isOwnProfile = isAuthenticated && currentUser?.username === username;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProfileUser(mockUser);
      setIsLoading(false);
    }, 500);
  }, [username]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="not-found">
        <h2>User not found</h2>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="container">
          <motion.div 
            className="profile-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="profile-main">
              <div className="avatar-section">
                <div className="profile-avatar">
                  {profileUser.avatar ? (
                    <img src={profileUser.avatar} alt={profileUser.fullName} />
                  ) : (
                    <span>{profileUser.fullName.charAt(0)}</span>
                  )}
                </div>
                <div className="level-badge">
                  <Star size={12} />
                  Level {profileUser.level}
                </div>
              </div>

              <div className="profile-info">
                <h1>{profileUser.fullName}</h1>
                <p className="username">@{profileUser.username}</p>
                
                {profileUser.bio && (
                  <p className="bio">{profileUser.bio}</p>
                )}

                <div className="profile-meta">
                  {profileUser.location.city && (
                    <span className="meta-item">
                      <MapPin size={14} />
                      {profileUser.location.city}, {profileUser.location.country}
                    </span>
                  )}
                  <span className="meta-item">
                    <Calendar size={14} />
                    Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Social Links */}
                <div className="social-links">
                  {profileUser.socialLinks.instagram && (
                    <a href={`https://instagram.com/${profileUser.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="social-link">
                      <Instagram size={18} />
                    </a>
                  )}
                  {profileUser.socialLinks.website && (
                    <a href={`https://${profileUser.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="social-link">
                      <LinkIcon size={18} />
                    </a>
                  )}
                </div>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <Link to="/settings/profile" className="btn btn-outline">
                    <Edit size={16} />
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <button className="btn btn-primary">
                      Follow
                    </button>
                    <button className="btn btn-outline icon-only">
                      <Share2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{profileUser.points.toLocaleString()}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats.tournamentsJoined}</span>
                <span className="stat-label">Tournaments</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats.tournamentsWon}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats.totalVotesReceived.toLocaleString()}</span>
                <span className="stat-label">Votes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats.totalPhotosUploaded}</span>
                <span className="stat-label">Photos</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Badges Section */}
        <motion.div 
          className="badges-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Badges & Achievements</h3>
          <div className="badges-row">
            {profileUser.badges.map((badge, index) => (
              <div key={index} className="badge-card">
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <Camera size={18} />
            Portfolio
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            <Trophy size={18} />
            Tournaments
          </button>
        </div>

        {/* Portfolio Grid */}
        {activeTab === 'portfolio' && (
          <motion.div 
            className="portfolio-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {profileUser.portfolio.map((photo, index) => (
              <motion.div 
                key={photo.id}
                className="portfolio-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <img src={photo.imageUrl} alt={photo.title} />
                <div className="portfolio-overlay">
                  <span className="photo-title">{photo.title}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <motion.div 
            className="tournaments-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-state">
              <Trophy size={48} className="empty-icon" />
              <p>Tournament history coming soon</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;

