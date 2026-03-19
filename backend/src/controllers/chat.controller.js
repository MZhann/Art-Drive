const ChatMessage = require('../models/ChatMessage.model');

/**
 * @desc    Get recent chat messages
 * @route   GET /api/chat/messages
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      ChatMessage.find()
        .populate('user', 'username fullName avatar role')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      ChatMessage.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMessages
};
