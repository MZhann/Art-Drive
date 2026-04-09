const Notification = require('../models/Notification.model');
const { getBadgeCatalog } = require('../services/badgeService');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: { notification } });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

const getBadges = async (req, res) => {
  try {
    res.json({ success: true, data: { badges: getBadgeCatalog() } });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ success: false, message: 'Failed to get badges' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getBadges
};
