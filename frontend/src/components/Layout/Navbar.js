import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../services/api.service';
import { API_CONFIG } from '../../config/api.config';
import io from 'socket.io-client';
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
  Heart,
  Award,
  TrendingUp,
  MessageCircle,
  Star
} from 'lucide-react';
import './Navbar.css';

const NOTIF_ICONS = {
  vote_received: Heart,
  tournament_reminder: Bell,
  tournament_won: Trophy,
  badge_earned: Award,
  level_up: TrendingUp,
  job_application: Briefcase,
  job_accepted: Star,
  job_rejected: X,
  job_completed: Star,
  system: Bell
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const Navbar = () => {
  const { user, isAuthenticated, logout, isDevMode, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll({ page: 1, limit: 8 }),
        notificationAPI.getUnreadCount()
      ]);
      if (notifRes.data.success) setNotifications(notifRes.data.data.notifications);
      if (countRes.data.success) setUnreadCount(countRes.data.data.unreadCount);
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    const socket = io(API_CONFIG.SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('authenticate', user.id);
    socket.on('new-notification', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 8));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [isAuthenticated, user, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await notificationAPI.markAsRead(notification._id);
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setShowNotifications(false);
    const link = notification.data?.link;
    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const navLinks = [
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/photographers', label: 'Photographers', icon: Camera },
    { path: '/leaderboard', label: 'Leaderboard', icon: Award },
    { path: '/jobs', label: 'Find Work', icon: Briefcase },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
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
              <div className="notification-container">
                <button 
                  className="nav-icon-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div 
                      className="notification-overlay"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <button className="mark-all-btn" onClick={handleMarkAllRead}>Mark all read</button>
                        )}
                      </div>
                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <div className="notification-empty">
                            <Bell size={24} style={{ opacity: 0.3 }} />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const IconComp = NOTIF_ICONS[notification.type] || Bell;
                            return (
                              <div
                                key={notification._id}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                {notification.data?.badgeIcon ? (
                                  <span className="notification-icon-emoji">{notification.data.badgeIcon}</span>
                                ) : (
                                  <IconComp size={16} className="notification-icon" />
                                )}
                                <div className="notification-content">
                                  <p className="notification-title">{notification.title}</p>
                                  <p className="notification-text">{notification.message}</p>
                                  <span className="notification-time">{timeAgo(notification.createdAt)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="notification-footer">
                        <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                          View All Notifications
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

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

