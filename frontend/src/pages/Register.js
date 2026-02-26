import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Camera, Briefcase } from 'lucide-react';
import { ROLES } from '../config/api.config';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    role: ROLES.PHOTOGRAPHER
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      fullName: formData.fullName,
      role: formData.role
    });

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-gradient"></div>
        <div className="auth-bg-pattern"></div>
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span className="text-gradient">Art</span>Drive
            </Link>
            <h1>Join ArtDrive</h1>
            <p className="text-secondary">
              {step === 1 
                ? 'Choose how you want to participate' 
                : 'Create your account'}
            </p>
          </div>

          {step === 1 ? (
            <div className="role-selection">
              <motion.button
                type="button"
                className={`role-card ${formData.role === ROLES.PHOTOGRAPHER ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(ROLES.PHOTOGRAPHER)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="role-icon photographer">
                  <Camera size={32} />
                </div>
                <h3>Photographer</h3>
                <p>Compete in tournaments, build your portfolio, and showcase your art</p>
                <ul className="role-features">
                  <li>Join competitions</li>
                  <li>Upload portfolio</li>
                  <li>Earn points & badges</li>
                  <li>Get hired</li>
                </ul>
              </motion.button>

              <motion.button
                type="button"
                className={`role-card ${formData.role === ROLES.EMPLOYER ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(ROLES.EMPLOYER)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="role-icon employer">
                  <Briefcase size={32} />
                </div>
                <h3>Employer</h3>
                <p>Find talented photographers and hire for your projects</p>
                <ul className="role-features">
                  <li>Post job listings</li>
                  <li>Browse portfolios</li>
                  <li>Vote in competitions</li>
                  <li>Direct messaging</li>
                </ul>
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="selected-role-badge">
                {formData.role === ROLES.PHOTOGRAPHER ? (
                  <><Camera size={16} /> Photographer</>
                ) : (
                  <><Briefcase size={16} /> Employer</>
                )}
                <button 
                  type="button" 
                  className="change-role-btn"
                  onClick={() => setStep(1)}
                >
                  Change
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      className="input"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">@</span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="input with-prefix"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="input"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className="input"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner-small"></span>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

