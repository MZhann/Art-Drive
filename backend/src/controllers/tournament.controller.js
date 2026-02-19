const Tournament = require('../models/Tournament.model');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all tournaments (with filters)
 * @route   GET /api/tournaments
 * @access  Public
 */
const getTournaments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      sort = '-createdAt'
    } = req.query;

    const query = { 'settings.isPublic': true };

    if (status) {
      if (status === 'live') {
        query.status = { $in: ['registration', 'live', 'voting'] };
      } else {
        query.status = status;
      }
    }

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tournaments, total] = await Promise.all([
      Tournament.find(query)
        .select('title category coverImage prizeFund status registrationEnd votingEnd stats isHot tags')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Tournament.countDocuments(query)
    ]);

    // Update status for each tournament based on dates
    const updatedTournaments = tournaments.map(t => {
      t.updateStatus();
      return t;
    });

    res.json({
      success: true,
      data: {
        tournaments: updatedTournaments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tournaments'
    });
  }
};

/**
 * @desc    Get tournament by ID
 * @route   GET /api/tournaments/:id
 * @access  Public
 */
const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username fullName avatar')
      .populate('judges', 'username fullName avatar')
      .populate('createdBy', 'username fullName');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Update view count
    tournament.stats.totalViews += 1;
    tournament.updateStatus();
    await tournament.save();

    res.json({
      success: true,
      data: {
        tournament
      }
    });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament'
    });
  }
};

/**
 * @desc    Create new tournament
 * @route   POST /api/tournaments
 * @access  Private (Admin)
 */
const createTournament = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const tournamentData = {
      ...req.body,
      createdBy: req.user._id || req.user.id
    };

    const tournament = await Tournament.create(tournamentData);

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: {
        tournament
      }
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tournament'
    });
  }
};

/**
 * @desc    Update tournament
 * @route   PUT /api/tournaments/:id
 * @access  Private (Admin)
 */
const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: {
        tournament
      }
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tournament'
    });
  }
};

/**
 * @desc    Register for tournament
 * @route   POST /api/tournaments/:id/register
 * @access  Private (Photographer)
 */
const registerForTournament = async (req, res) => {
  try {
    const { photoUrl, photoTitle, photoDescription } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL is required'
      });
    }

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check tournament status
    tournament.updateStatus();
    if (tournament.status !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Tournament registration is not open'
      });
    }

    // Check if already registered
    const userId = req.user._id || req.user.id;
    const isRegistered = tournament.participants.some(
      p => p.user.toString() === userId.toString()
    );

    if (isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this tournament'
      });
    }

    // Check max participants
    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Add participant
    tournament.participants.push({
      user: userId,
      photo: {
        url: photoUrl,
        title: photoTitle || '',
        description: photoDescription || ''
      }
    });

    tournament.stats.totalParticipants = tournament.participants.length;
    await tournament.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.tournamentsJoined': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for tournament',
      data: {
        participantCount: tournament.participants.length
      }
    });
  } catch (error) {
    console.error('Register for tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for tournament'
    });
  }
};

/**
 * @desc    Vote for a participant
 * @route   POST /api/tournaments/:id/vote/:participantId
 * @access  Private
 */
const voteForParticipant = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if voting is open
    tournament.updateStatus();
    if (tournament.status !== 'voting' && tournament.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Voting is not open for this tournament'
      });
    }

    // Find participant
    const participant = tournament.participants.id(req.params.participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Increment vote
    participant.votes += 1;
    tournament.stats.totalVotes += 1;
    await tournament.save();

    // Update participant's total votes received
    await User.findByIdAndUpdate(participant.user, {
      $inc: { 
        'stats.totalVotesReceived': 1,
        'points': 10 // Award points for receiving a vote
      }
    });

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament-${req.params.id}`).emit('vote-update', {
        participantId: req.params.participantId,
        votes: participant.votes,
        totalVotes: tournament.stats.totalVotes
      });
    }

    res.json({
      success: true,
      message: 'Vote recorded',
      data: {
        votes: participant.votes
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
};

/**
 * @desc    Get tournament leaderboard
 * @route   GET /api/tournaments/:id/leaderboard
 * @access  Public
 */
const getTournamentLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username fullName avatar');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const leaderboard = tournament.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      data: {
        leaderboard,
        totalParticipants: tournament.participants.length,
        totalVotes: tournament.stats.totalVotes
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
};

/**
 * @desc    Get live tournaments
 * @route   GET /api/tournaments/status/live
 * @access  Public
 */
const getLiveTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.getLiveTournaments()
      .select('title category coverImage prizeFund status registrationEnd votingEnd stats isHot sponsorGift')
      .limit(20);

    res.json({
      success: true,
      data: {
        tournaments
      }
    });
  } catch (error) {
    console.error('Get live tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get live tournaments'
    });
  }
};

/**
 * @desc    Get upcoming tournaments
 * @route   GET /api/tournaments/status/upcoming
 * @access  Public
 */
const getUpcomingTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.getUpcomingTournaments()
      .select('title category coverImage prizeFund status registrationStart stats')
      .limit(20);

    res.json({
      success: true,
      data: {
        tournaments
      }
    });
  } catch (error) {
    console.error('Get upcoming tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming tournaments'
    });
  }
};

/**
 * @desc    Delete tournament
 * @route   DELETE /api/tournaments/:id
 * @access  Private (Admin)
 */
const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tournament'
    });
  }
};

module.exports = {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  registerForTournament,
  voteForParticipant,
  getTournamentLeaderboard,
  getLiveTournaments,
  getUpcomingTournaments,
  deleteTournament
};

