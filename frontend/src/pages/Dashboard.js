import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { tournamentAPI, notificationAPI } from '../services/api.service';
import { 
  Trophy, 
  Camera, 
  Star, 
  TrendingUp, 
  Calendar,
  Award,
  Users,
  Plus,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [liveTournaments, setLiveTournaments] = useState([]);
  const [allBadges, setAllBadges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournRes, badgeRes] = await Promise.all([
          tournamentAPI.getLive(),
          notificationAPI.getBadges()
        ]);
        if (tournRes.data.success) setLiveTournaments(tournRes.data.data.tournaments.slice(0, 3));
        if (badgeRes.data.success) setAllBadges(badgeRes.data.data.badges);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const userBadges = user?.badges || [];
  const earnedNames = new Set(userBadges.map(b => b.name));
  const lockedBadges = allBadges.filter(b => !earnedNames.has(b.name)).slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Welcome Header */}
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="welcome-section">
            <h1>Welcome back, <span className="text-gradient">{user?.fullName}</span>!</h1>
            <p className="text-secondary">
              {user?.role === 'photographer' 
                ? "Ready to compete and showcase your creativity?" 
                : user?.role === 'employer'
                ? "Find the perfect photographer for your next project"
                : "Manage the platform and create amazing experiences"}
            </p>
          </div>
          <div className="header-actions">
            {user?.role === 'photographer' && (
              <Link to="/tournaments" className="btn btn-primary">
                <Trophy size={18} />
                Join Tournament
              </Link>
            )}
            {user?.role === 'employer' && (
              <Link to="/employer/dashboard?create=true" className="btn btn-primary">
                <Plus size={18} />
                Post a Job
              </Link>
            )}
            {isAdmin() && (
              <Link to="/admin/tournaments/create" className="btn btn-primary">
                <Plus size={18} />
                Create Tournament
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Stats Cards */}
          <motion.div className="stats-row" variants={itemVariants}>
            {user?.role === 'photographer' ? (
              <>
                <div className="stat-card">
                  <div className="stat-icon points">
                    <Star size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{user?.points || 0}</span>
                    <span className="stat-label">Total Points</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon level">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">Level {user?.level || 1}</span>
                    <span className="stat-label">Current Level</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon tournaments">
                    <Trophy size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{user?.stats?.tournamentsJoined || 0}</span>
                    <span className="stat-label">Tournaments</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon wins">
                    <Award size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{user?.stats?.tournamentsWon || 0}</span>
                    <span className="stat-label">Wins</span>
                  </div>
                </div>
              </>
            ) : user?.role === 'employer' ? (
              <>
                <div className="stat-card">
                  <div className="stat-icon points">
                    <Briefcase size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">5</span>
                    <span className="stat-label">Active Jobs</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon level">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">23</span>
                    <span className="stat-label">Applications</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon tournaments">
                    <Camera size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">8</span>
                    <span className="stat-label">Hired</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon wins">
                    <Star size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">4.8</span>
                    <span className="stat-label">Rating</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-icon points">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">10,234</span>
                    <span className="stat-label">Total Users</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon level">
                    <Trophy size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">156</span>
                    <span className="stat-label">Tournaments</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon tournaments">
                    <Camera size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">45,678</span>
                    <span className="stat-label">Photos</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon wins">
                    <Star size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">$125K</span>
                    <span className="stat-label">Prizes Awarded</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Main Content Grid */}
          <div className="content-grid">
            {/* Active Tournaments */}
            <motion.div className="dashboard-card" variants={itemVariants}>
              <div className="card-header">
                <h3>
                  <Trophy size={20} />
                  {user?.role === 'photographer' ? 'Your Tournaments' : 'Active Tournaments'}
                </h3>
                <Link to="/tournaments" className="card-link">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              <div className="card-content">
                {liveTournaments.length > 0 ? (
                  <div className="tournament-list-dashboard">
                    {liveTournaments.map(tournament => (
                      <div key={tournament._id} className="tournament-item">
                        <div className="tournament-item-info">
                          <h4>{tournament.title}</h4>
                          <div className="tournament-meta">
                            <span className={`badge ${tournament.status === 'voting' ? 'badge-live' : ''}`}>
                              {tournament.status === 'voting' ? 'Voting' : tournament.status === 'registration' ? 'Open' : tournament.status}
                            </span>
                            <span>{tournament.stats?.totalParticipants || 0} participants</span>
                          </div>
                        </div>
                        <Link to={`/tournaments/${tournament._id}`} className="btn btn-outline btn-sm">
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Trophy size={48} className="empty-icon" />
                    <p>No active tournaments</p>
                    <Link to="/tournaments" className="btn btn-primary btn-sm">
                      Browse Tournaments
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Badges/Achievements (for photographers) */}
            {user?.role === 'photographer' && (
              <motion.div className="dashboard-card" variants={itemVariants}>
                <div className="card-header">
                  <h3>
                    <Award size={20} />
                    Your Badges
                  </h3>
                </div>
                <div className="card-content">
                  <div className="badges-grid">
                    {userBadges.length > 0 ? (
                      userBadges.map((badge, index) => (
                        <div key={index} className="badge-item">
                          <span className="badge-icon">{badge.icon}</span>
                          <div className="badge-info">
                            <span className="badge-name">{badge.name}</span>
                            <span className="badge-desc">{badge.description}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="badge-item empty-badge">
                        <span className="badge-icon">🎯</span>
                        <div className="badge-info">
                          <span className="badge-name">No badges yet</span>
                          <span className="badge-desc">Compete to earn your first badge!</span>
                        </div>
                      </div>
                    )}
                    {lockedBadges.map((badge, index) => (
                      <div key={`locked-${index}`} className="badge-item locked">
                        <span className="badge-icon">🔒</span>
                        <div className="badge-info">
                          <span className="badge-name">{badge.name}</span>
                          <span className="badge-desc">{badge.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link to="/leaderboard" className="card-link" style={{ fontSize: '0.85rem' }}>
                      View Leaderboard <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div className="dashboard-card" variants={itemVariants}>
              <div className="card-header">
                <h3>
                  <Calendar size={20} />
                  Quick Actions
                </h3>
              </div>
              <div className="card-content">
                <div className="quick-actions">
                  {user?.role === 'photographer' && (
                    <>
                      <Link to={`/profile/${user?.username}`} className="action-btn">
                        <Camera size={20} />
                        <span>My Portfolio</span>
                      </Link>
                      <Link to="/tournaments" className="action-btn">
                        <Trophy size={20} />
                        <span>Tournaments</span>
                      </Link>
                      <Link to="/jobs" className="action-btn">
                        <Briefcase size={20} />
                        <span>Browse Jobs</span>
                      </Link>
                      <Link to="/my-applications" className="action-btn">
                        <Users size={20} />
                        <span>My Applications</span>
                      </Link>
                    </>
                  )}
                  {user?.role === 'employer' && (
                    <>
                      <Link to="/employer/dashboard?create=true" className="action-btn">
                        <Plus size={20} />
                        <span>Post Job</span>
                      </Link>
                      <Link to="/photographers" className="action-btn">
                        <Camera size={20} />
                        <span>Find Photographers</span>
                      </Link>
                      <Link to="/employer/dashboard" className="action-btn">
                        <Users size={20} />
                        <span>My Jobs</span>
                      </Link>
                      <Link to="/jobs" className="action-btn">
                        <Briefcase size={20} />
                        <span>Browse Jobs</span>
                      </Link>
                    </>
                  )}
                  {isAdmin() && (
                    <>
                      <Link to="/admin/tournaments/create" className="action-btn">
                        <Plus size={20} />
                        <span>Create Tournament</span>
                      </Link>
                      <Link to="/tournaments" className="action-btn">
                        <Trophy size={20} />
                        <span>Manage Tournaments</span>
                      </Link>
                      <Link to="/photographers" className="action-btn">
                        <Users size={20} />
                        <span>View Users</span>
                      </Link>
                      <Link to={`/profile/${user?.username}`} className="action-btn">
                        <Award size={20} />
                        <span>My Profile</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

