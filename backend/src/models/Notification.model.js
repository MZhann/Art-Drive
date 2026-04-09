const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'vote_received',
      'tournament_reminder',
      'tournament_started',
      'tournament_won',
      'tournament_completed',
      'badge_earned',
      'level_up',
      'job_application',
      'job_accepted',
      'job_rejected',
      'job_completed',
      'points_earned',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    badgeName: String,
    badgeIcon: String,
    points: Number,
    level: Number,
    link: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
