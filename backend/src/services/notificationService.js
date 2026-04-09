const Notification = require('../models/Notification.model');

let ioInstance = null;

function initNotificationService(io) {
  ioInstance = io;
}

async function createNotification({ recipient, type, title, message, data }) {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      data: data || {}
    });

    if (ioInstance) {
      ioInstance.to(`user-${recipient.toString()}`).emit('new-notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

async function notifyVoteReceived(recipientId, voterName, tournamentTitle, tournamentId) {
  return createNotification({
    recipient: recipientId,
    type: 'vote_received',
    title: 'New Vote!',
    message: `${voterName} liked your photo in "${tournamentTitle}"`,
    data: { tournamentId, link: `/tournaments/${tournamentId}` }
  });
}

async function notifyTournamentReminder(recipientId, tournamentTitle, tournamentId) {
  return createNotification({
    recipient: recipientId,
    type: 'tournament_reminder',
    title: 'Tournament Starting Soon!',
    message: `"${tournamentTitle}" starts voting in 5 minutes!`,
    data: { tournamentId, link: `/tournaments/${tournamentId}` }
  });
}

async function notifyTournamentWon(recipientId, tournamentTitle, tournamentId, position, points) {
  const posLabel = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`;
  return createNotification({
    recipient: recipientId,
    type: 'tournament_won',
    title: 'Tournament Results!',
    message: `You placed ${posLabel} in "${tournamentTitle}" and earned ${points} points!`,
    data: { tournamentId, points, link: `/tournaments/${tournamentId}` }
  });
}

async function notifyBadgeEarned(recipientId, badgeName, badgeIcon) {
  return createNotification({
    recipient: recipientId,
    type: 'badge_earned',
    title: 'New Badge Earned!',
    message: `You earned the "${badgeName}" badge!`,
    data: { badgeName, badgeIcon }
  });
}

async function notifyLevelUp(recipientId, newLevel) {
  return createNotification({
    recipient: recipientId,
    type: 'level_up',
    title: 'Level Up!',
    message: `Congratulations! You reached Level ${newLevel}!`,
    data: { level: newLevel }
  });
}

async function notifyJobApplication(employerId, photographerName, jobTitle, jobId) {
  return createNotification({
    recipient: employerId,
    type: 'job_application',
    title: 'New Application',
    message: `${photographerName} applied for "${jobTitle}"`,
    data: { jobId, link: `/jobs/${jobId}` }
  });
}

async function notifyJobAccepted(photographerId, employerName, jobTitle, jobId) {
  return createNotification({
    recipient: photographerId,
    type: 'job_accepted',
    title: 'Application Accepted!',
    message: `${employerName} accepted your application for "${jobTitle}"`,
    data: { jobId, link: `/jobs/${jobId}` }
  });
}

async function notifyJobRejected(photographerId, jobTitle, jobId) {
  return createNotification({
    recipient: photographerId,
    type: 'job_rejected',
    title: 'Application Update',
    message: `Your application for "${jobTitle}" was not selected`,
    data: { jobId, link: `/jobs/${jobId}` }
  });
}

async function notifyJobCompleted(photographerId, jobTitle, jobId, pointsEarned) {
  return createNotification({
    recipient: photographerId,
    type: 'job_completed',
    title: 'Job Completed!',
    message: `"${jobTitle}" has been marked as completed. You earned ${pointsEarned} points!`,
    data: { jobId, points: pointsEarned, link: `/jobs/${jobId}` }
  });
}

module.exports = {
  initNotificationService,
  createNotification,
  notifyVoteReceived,
  notifyTournamentReminder,
  notifyTournamentWon,
  notifyBadgeEarned,
  notifyLevelUp,
  notifyJobApplication,
  notifyJobAccepted,
  notifyJobRejected,
  notifyJobCompleted
};
