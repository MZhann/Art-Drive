const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['photographer', 'employer', 'admin', 'judge'],
    default: 'photographer'
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: 'Kazakhstan' }
  },
  portfolio: [{
    imageUrl: String,
    title: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  socialLinks: {
    instagram: { type: String, default: '' },
    behance: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  // Gamification
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  // Statistics
  stats: {
    tournamentsJoined: { type: Number, default: 0 },
    tournamentsWon: { type: Number, default: 0 },
    totalVotesReceived: { type: Number, default: 0 },
    totalPhotosUploaded: { type: Number, default: 0 }
  },
  // Employer specific fields
  companyName: {
    type: String,
    default: ''
  },
  companyDescription: {
    type: String,
    default: ''
  },
  // Account status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ points: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role,
      username: this.username
    },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.expiresIn }
  );
};

// Calculate level based on points
userSchema.methods.calculateLevel = function() {
  // Level up every 1000 points
  this.level = Math.floor(this.points / 1000) + 1;
  return this.level;
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    fullName: this.fullName,
    role: this.role,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    portfolio: this.portfolio,
    socialLinks: this.socialLinks,
    points: this.points,
    level: this.level,
    badges: this.badges,
    stats: this.stats,
    companyName: this.companyName,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);

