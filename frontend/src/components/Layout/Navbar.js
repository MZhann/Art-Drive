import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Trophy, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard,
  Camera,
  Bell,
  Settings
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, isDevMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/photographers', label: 'Photographers', icon: Camera },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎨</span>
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
        </div>

        {/* Right Section */}
        <div className="navbar-actions">
          {isDevMode && (
            <span className="dev-badge">DEV MODE</span>
          )}

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <button className="nav-icon-btn">
                <Bell size={20} />
                <span className="notification-dot"></span>
              </button>

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

