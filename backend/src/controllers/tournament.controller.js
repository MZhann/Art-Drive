const Tournament = require('../models/Tournament.model');
const TournamentVote = require('../models/TournamentVote.model');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');

// Anti-spam: max votes per minute per user
const VOTES_PER_MINUTE_LIMIT = 60;

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
        .select('title description category coverImage prizeFund prizes rules status registrationStart registrationEnd votingStart votingEnd stats isHot tags maxParticipants createdBy')
        .populate('createdBy', 'username fullName')
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

    const {
      title,
      description,
      category,
      coverImage,
      rules,
      maxParticipants,
      registrationStart,
      registrationEnd,
      votingStart,
      votingEnd,
      prizes,
      prizeFund,
      sponsorGift,
      tags,
      settings
    } = req.body;

    // Determine initial status based on dates
    const now = new Date();
    const regStart = new Date(registrationStart);
    let status = 'upcoming';
    if (now >= regStart) {
      status = 'registration';
    }

    const tournamentData = {
      title,
      description,
      category,
      coverImage: coverImage || '',
      rules: rules || '',
      maxParticipants: maxParticipants || 500,
      registrationStart,
      registrationEnd,
      votingStart,
      votingEnd,
      status,
      prizes: {
        points: prizes?.points ?? 10,
        badge: {
          name: prizes?.badge?.name || 'Tournament Winner',
          description: prizes?.badge?.description || `Winner of ${title}`,
          icon: prizes?.badge?.icon || '🏆'
        },
        newsPageDays: prizes?.newsPageDays ?? 2,
        additionalPrizes: prizes?.additionalPrizes || ''
      },
      prizeFund: prizeFund || { amount: 0, currency: 'USD' },
      sponsorGift: sponsorGift || { title: '', description: '', image: '' },
      tags: tags || [],
      settings: settings || {},
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
      message: 'Failed to create tournament',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const { photoTitle, photoDescription } = req.body;

    // Support both file upload and URL
    let photoUrl = req.body.photoUrl || '';
    if (req.file) {
      photoUrl = `/uploads/tournaments/${req.file.filename}`;
    }

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'A photo is required to register. Upload a file or provide a URL.'
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
 * @desc    Vote for a participant (like)
 * @route   POST /api/tournaments/:id/vote/:participantId
 * @access  Private
 * Anti-spam: one like per user per participant, rate limit 60/min
 */
const voteForParticipant = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const tournamentId = req.params.id;
    const participantId = req.params.participantId;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    tournament.updateStatus();
    if (tournament.status !== 'voting' && tournament.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Voting is not open for this tournament'
      });
    }

    const participant = tournament.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Anti-spam: can't vote for your own submission
    if (participant.user.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote for your own submission'
      });
    }

    // Anti-spam: check if already voted for this participant
    const existingVote = await TournamentVote.findOne({
      user: userId,
      tournament: tournamentId,
      participant: participantId
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: existingVote.action === 'like'
          ? 'You have already voted for this participant'
          : 'You have already skipped this participant'
      });
    }

    // Rate limit: max votes per minute
    const oneMinAgo = new Date(Date.now() - 60000);
    const recentVotesCount = await TournamentVote.countDocuments({
      user: userId,
      tournament: tournamentId,
      action: 'like',
      createdAt: { $gte: oneMinAgo }
    });
    if (recentVotesCount >= VOTES_PER_MINUTE_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Too many votes. Please wait a moment.'
      });
    }

    // Record vote
    await TournamentVote.create({
      user: userId,
      tournament: tournamentId,
      participant: participantId,
      action: 'like'
    });

    participant.votes += 1;
    tournament.stats.totalVotes += 1;
    await tournament.save();

    await User.findByIdAndUpdate(participant.user, {
      $inc: {
        'stats.totalVotesReceived': 1,
        points: 10
      }
    });

    const io = req.app.get('io');
    if (io) {
      const participantsWithVotes = tournament.participants.map((p) => ({
        participantId: p._id.toString(),
        userId: p.user.toString(),
        votes: p.votes
      }));
      io.to(`tournament-${tournamentId}`).emit('vote-update', {
        participantId,
        votes: participant.votes,
        totalVotes: tournament.stats.totalVotes,
        participants: participantsWithVotes
      });
    }

    res.json({
      success: true,
      message: 'Vote recorded',
      data: { votes: participant.votes }
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
 * @desc    Skip a participant (dislike / no vote)
 * @route   POST /api/tournaments/:id/skip/:participantId
 * @access  Private
 */
const skipParticipant = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const tournamentId = req.params.id;
    const participantId = req.params.participantId;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    tournament.updateStatus();
    if (tournament.status !== 'voting' && tournament.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Voting is not open for this tournament'
      });
    }

    const participant = tournament.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    const existing = await TournamentVote.findOne({
      user: userId,
      tournament: tournamentId,
      participant: participantId
    });
    if (existing && existing.action === 'like') {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this participant'
      });
    }
    await TournamentVote.findOneAndUpdate(
      { user: userId, tournament: tournamentId, participant: participantId },
      { $set: { action: 'skip', updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Skipped',
      data: { skipped: true }
    });
  } catch (error) {
    console.error('Skip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip'
    });
  }
};

/**
 * @desc    Start tournament (admin only)
 * @route   POST /api/tournaments/:id/start
 * @access  Private (Admin)
 */
const startTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const validStatuses = ['registration', 'upcoming', 'live'];
    if (!validStatuses.includes(tournament.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot start tournament in status: ${tournament.status}`
      });
    }

    tournament.status = 'voting';
    const now = new Date();
    // Adjust all date boundaries so updateStatus() keeps status as 'voting'
    if (new Date(tournament.registrationEnd) > now) {
      tournament.registrationEnd = now;
    }
    if (new Date(tournament.votingStart) > now) {
      tournament.votingStart = now;
    }
    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament started. Voting is now open.',
      data: { tournament }
    });
  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start tournament'
    });
  }
};

/**
 * @desc    Get vote progress for current user (voted IDs, my participant votes)
 * @route   GET /api/tournaments/:id/vote-progress
 * @access  Private
 */
const getVoteProgress = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const tournamentId = req.params.id;

    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user', 'username fullName avatar')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const votes = await TournamentVote.find({
      user: userId,
      tournament: tournamentId
    }).select('participant action');

    const votedParticipantIds = votes.map((v) => v.participant.toString());
    const uid = userId.toString();
    const myParticipant = tournament.participants.find((p) => {
      const pu = p.user?._id || p.user;
      return pu && pu.toString() === uid;
    });

    res.json({
      success: true,
      data: {
        votedParticipantIds,
        myParticipantVotes: myParticipant ? myParticipant.votes : 0,
        isParticipant: !!myParticipant,
        totalParticipants: tournament.participants.length,
        participants: tournament.participants,
        tournament: {
          id: tournament._id,
          title: tournament.title,
          category: tournament.category,
          status: tournament.status
        }
      }
    });
  } catch (error) {
    console.error('Get vote progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vote progress'
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
  skipParticipant,
  startTournament,
  getVoteProgress,
  getTournamentLeaderboard,
  getLiveTournaments,
  getUpcomingTournaments,
  deleteTournament
};

