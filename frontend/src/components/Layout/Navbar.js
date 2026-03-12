import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { jobAPI } from '../../services/api.service';
import { 
  Trophy, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard,
  Camera,
  Bell,
  Settings,
  Plus,
  Shield,
  Briefcase,
  CheckCircle
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, isDevMode, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Fetch notifications for photographers (accepted applications)
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'photographer') {
      return;
    }

    try {
      const response = await jobAPI.getAll({ page: 1, limit: 1000, status: 'open' });
      if (response.data.success) {
        const allJobs = response.data.data.jobs;
        const acceptedApplications = [];

        for (const job of allJobs) {
          try {
            const jobDetailResponse = await jobAPI.getById(job._id);
            if (jobDetailResponse.data.success) {
              const jobDetail = jobDetailResponse.data.data.job;
              const application = jobDetail.applications?.find(
                app => (app.photographer?._id === user.id || app.photographer === user.id) && app.status === 'accepted'
              );
              if (application) {
                acceptedApplications.push({
                  id: `${job._id}-${application._id}`,
                  jobId: job._id,
                  jobTitle: job.title,
                  employerName: jobDetail.employer?.fullName,
                  appliedAt: application.appliedAt,
                  read: localStorage.getItem(`notification-${job._id}-${application._id}`) === 'read'
                });
              }
            }
          } catch (err) {
            // Skip if job detail fetch fails
          }
        }

        setNotifications(acceptedApplications);
        setUnreadCount(acceptedApplications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'photographer') {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  const handleNotificationClick = (notification) => {
    localStorage.setItem(`notification-${notification.jobId}-${notification.id.split('-')[1]}`, 'read');
    setShowNotifications(false);
    navigate(`/jobs/${notification.jobId}`);
  };

  const navLinks = [
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/photographers', label: 'Photographers', icon: Camera },
    { path: '/jobs', label: 'Find Work', icon: Briefcase },
  ];

  // Add admin link to create tournament if user is admin
  const adminNavLinks = isAuthenticated && isAdmin() ? [
    { path: '/admin/tournaments/create', label: 'Create Tournament', icon: Plus },
  ] : [];

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">
            <span className="text-gradient">Art</span>Drive
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
          {adminNavLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link admin-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="navbar-actions">
          {isDevMode && (
            <span className="dev-badge">DEV MODE</span>
          )}

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              {user?.role === 'photographer' && (
                <div className="notification-container">
                  <button 
                    className="nav-icon-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>
                  {showNotifications && notifications.length > 0 && (
                    <>
                      <div 
                        className="notification-overlay"
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="notification-dropdown">
                        <div className="notification-header">
                          <h3>Notifications</h3>
                          <button onClick={() => setShowNotifications(false)}>×</button>
                        </div>
                        <div className="notification-list">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`notification-item ${!notification.read ? 'unread' : ''}`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <CheckCircle size={16} className="notification-icon" />
                              <div className="notification-content">
                                <p className="notification-title">Application Accepted!</p>
                                <p className="notification-text">
                                  Your application for <strong>{notification.jobTitle}</strong> has been accepted by {notification.employerName}
                                </p>
                                <span className="notification-time">
                                  {new Date(notification.appliedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="notification-footer">
                          <Link to="/my-applications" onClick={() => setShowNotifications(false)}>
                            View All Applications
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* User Menu */}
              <div className="user-menu-container">
                <button
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} />
                    ) : (
                      <span>{user?.fullName?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <span className="user-name">{user?.fullName}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="user-menu-overlay"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="user-menu">
                      <div className="user-menu-header">
                        <p className="user-menu-name">{user?.fullName}</p>
                        <p className="user-menu-role">{user?.role}</p>
                      </div>
                      <div className="user-menu-divider" />
                      <Link 
                        to="/dashboard" 
                        className="user-menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                      </Link>
                      <Link 
                        to={`/profile/${user?.username}`} 
                        className="user-menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={18} />
                        <span>Profile</span>
                      </Link>
                      <Link 
                        to="/settings" 
                        className="user-menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings size={18} />
                        <span>Settings</span>
                      </Link>
                      {user?.role === 'employer' && (
                        <>
                          <div className="user-menu-divider" />
                          <Link 
                            to="/employer/dashboard" 
                            className="user-menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Briefcase size={18} />
                            <span>My Jobs</span>
                          </Link>
                        </>
                      )}
                      {user?.role === 'photographer' && (
                        <>
                          <div className="user-menu-divider" />
                          <Link 
                            to="/my-applications" 
                            className="user-menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Briefcase size={18} />
                            <span>My Applications</span>
                          </Link>
                        </>
                      )}
                      {isAdmin() && (
                        <>
                          <div className="user-menu-divider" />
                          <Link 
                            to="/admin/tournaments/create" 
                            className="user-menu-item admin-menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield size={18} />
                            <span>Create Tournament</span>
                          </Link>
                        </>
                      )}
                      <div className="user-menu-divider" />
                      <button className="user-menu-item logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-links">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`mobile-nav-link ${isActive(path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          
          {!isAuthenticated && (
            <div className="mobile-auth-buttons">
              <Link 
                to="/login" 
                className="btn btn-outline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

