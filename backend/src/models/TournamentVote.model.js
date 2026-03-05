const mongoose = require('mongoose');

/**
 * Records each user's vote or skip for a participant in a tournament.
 * Used for: anti-spam (one like per user per participant), progress tracking.
 */
const tournamentVoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ['like', 'skip'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// One record per user per participant per tournament
tournamentVoteSchema.index(
  { user: 1, tournament: 1, participant: 1 },
  { unique: true }
);

// For efficient queries: get all voted participant IDs for a user in a tournament
tournamentVoteSchema.index({ user: 1, tournament: 1 });

// For rate limiting: count recent votes by user
tournamentVoteSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('TournamentVote', tournamentVoteSchema);
