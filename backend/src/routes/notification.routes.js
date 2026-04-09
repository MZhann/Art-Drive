const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getBadges
} = require('../controllers/notification.controller');

router.get('/badges', getBadges);

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.patch('/read-all', auth, markAllAsRead);
router.patch('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
