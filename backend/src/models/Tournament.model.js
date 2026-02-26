const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photo: {
    url: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  },
  votes: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tournament title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Tournament description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'abstract',
      'portrait',
      'landscape',
      'street',
      'nature',
      'architecture',
      'fashion',
      'sports',
      'wildlife',
      'macro',
      'cyberpunk',
      'character',
      'other'
    ]
  },
  coverImage: {
    type: String,
    default: ''
  },
  // Rules
  rules: {
    type: String,
    default: '',
    maxlength: [5000, 'Rules cannot exceed 5000 characters']
  },
  // Prize information
  prizes: {
    points: { type: Number, default: 10 },
    badge: {
      name: { type: String, default: 'Tournament Winner' },
      description: { type: String, default: 'Won a tournament on ArtDrive' },
      icon: { type: String, default: '🏆' }
    },
    newsPageDays: { type: Number, default: 2 },
    additionalPrizes: { type: String, default: '' }
  },
  prizeFund: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  sponsorGift: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  // Tournament timing
  registrationStart: {
    type: Date,
    required: true
  },
  registrationEnd: {
    type: Date,
    required: true
  },
  votingStart: {
    type: Date,
    required: true
  },
  votingEnd: {
    type: Date,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'registration', 'live', 'voting', 'completed', 'cancelled'],
    default: 'draft'
  },
  // Participants
  participants: [participantSchema],
  maxParticipants: {
    type: Number,
    default: 500
  },
  // Judges (optional)
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Tags for filtering
  tags: [{
    type: String,
    trim: true
  }],
  // Statistics
  stats: {
    totalParticipants: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 }
  },
  // Settings
  settings: {
    allowMultipleEntries: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    votingType: { 
      type: String, 
      enum: ['public', 'judges', 'mixed'],
      default: 'public'
    }
  },
  // Winners
  winners: [{
    position: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prize: String
  }],
  // Hot/Featured flag
  isHot: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ category: 1 });
tournamentSchema.index({ registrationEnd: 1 });
tournamentSchema.index({ votingEnd: 1 });
tournamentSchema.index({ 'stats.totalParticipants': -1 });

// Virtual for audience count (views)
tournamentSchema.virtual('audienceCount').get(function() {
  return this.stats.totalViews;
});

// Method to update tournament status based on dates
tournamentSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.status === 'cancelled' || this.status === 'draft') {
    return this.status;
  }
  
  if (now < this.registrationStart) {
    this.status = 'upcoming';
  } else if (now >= this.registrationStart && now < this.registrationEnd) {
    this.status = 'registration';
  } else if (now >= this.registrationEnd && now < this.votingStart) {
    this.status = 'live';
  } else if (now >= this.votingStart && now < this.votingEnd) {
    this.status = 'voting';
  } else if (now >= this.votingEnd) {
    this.status = 'completed';
  }
  
  return this.status;
};

// Method to get leaderboard
tournamentSchema.methods.getLeaderboard = function(limit = 10) {
  const sorted = [...this.participants].sort((a, b) => b.votes - a.votes);
  return sorted.slice(0, limit).map((p, index) => ({
    rank: index + 1,
    user: p.user,
    votes: p.votes,
    photo: p.photo
  }));
};

// Method to add participant
tournamentSchema.methods.addParticipant = function(userId, photoData) {
  // Check if user already registered
  const existing = this.participants.find(p => p.user.toString() === userId.toString());
  if (existing) {
    throw new Error('User already registered for this tournament');
  }
  
  // Check max participants
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Tournament is full');
  }
  
  this.participants.push({
    user: userId,
    photo: photoData
  });
  
  this.stats.totalParticipants = this.participants.length;
  return this;
};

// Static method to get live tournaments
tournamentSchema.statics.getLiveTournaments = function() {
  return this.find({ 
    status: { $in: ['registration', 'live', 'voting'] },
    'settings.isPublic': true
  }).sort({ registrationEnd: 1 });
};

// Static method to get upcoming tournaments
tournamentSchema.statics.getUpcomingTournaments = function() {
  return this.find({ 
    status: 'upcoming',
    'settings.isPublic': true
  }).sort({ registrationStart: 1 });
};

module.exports = mongoose.model('Tournament', tournamentSchema);

