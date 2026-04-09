const User = require('../models/User.model');
const { notifyBadgeEarned, notifyLevelUp } = require('./notificationService');

const BADGE_DEFINITIONS = [
  {
    id: 'first_upload',
    name: 'First Shot',
    description: 'Uploaded your first photo to portfolio',
    icon: '📸',
    check: (user) => user.stats.totalPhotosUploaded >= 1
  },
  {
    id: 'portfolio_5',
    name: 'Gallery Starter',
    description: 'Uploaded 5 photos to portfolio',
    icon: '🖼️',
    check: (user) => user.stats.totalPhotosUploaded >= 5
  },
  {
    id: 'portfolio_20',
    name: 'Portfolio Pro',
    description: 'Uploaded 20 photos to portfolio',
    icon: '🎨',
    check: (user) => user.stats.totalPhotosUploaded >= 20
  },
  {
    id: 'first_tournament',
    name: 'Competitor',
    description: 'Joined your first tournament',
    icon: '🎯',
    check: (user) => user.stats.tournamentsJoined >= 1
  },
  {
    id: 'tournaments_5',
    name: 'Veteran',
    description: 'Participated in 5 tournaments',
    icon: '⚔️',
    check: (user) => user.stats.tournamentsJoined >= 5
  },
  {
    id: 'tournaments_10',
    name: 'Tournament Master',
    description: 'Participated in 10 tournaments',
    icon: '🏟️',
    check: (user) => user.stats.tournamentsJoined >= 10
  },
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Won your first tournament',
    icon: '🏆',
    check: (user) => user.stats.tournamentsWon >= 1
  },
  {
    id: 'wins_3',
    name: 'Hat Trick',
    description: 'Won 3 tournaments',
    icon: '👑',
    check: (user) => user.stats.tournamentsWon >= 3
  },
  {
    id: 'wins_5',
    name: 'Champion',
    description: 'Won 5 tournaments',
    icon: '🏅',
    check: (user) => user.stats.tournamentsWon >= 5
  },
  {
    id: 'votes_50',
    name: 'Getting Noticed',
    description: 'Received 50 total votes',
    icon: '👍',
    check: (user) => user.stats.totalVotesReceived >= 50
  },
  {
    id: 'votes_100',
    name: 'Popular',
    description: 'Received 100 total votes',
    icon: '❤️',
    check: (user) => user.stats.totalVotesReceived >= 100
  },
  {
    id: 'votes_500',
    name: 'Fan Favorite',
    description: 'Received 500 total votes',
    icon: '🌟',
    check: (user) => user.stats.totalVotesReceived >= 500
  },
  {
    id: 'points_1000',
    name: 'Rising Star',
    description: 'Earned 1,000 points',
    icon: '⭐',
    check: (user) => user.points >= 1000
  },
  {
    id: 'points_5000',
    name: 'Elite',
    description: 'Earned 5,000 points',
    icon: '💎',
    check: (user) => user.points >= 5000
  },
  {
    id: 'level_5',
    name: 'Leveling Up',
    description: 'Reached Level 5',
    icon: '📈',
    check: (user) => user.level >= 5
  },
  {
    id: 'level_10',
    name: 'Legend',
    description: 'Reached Level 10',
    icon: '🔥',
    check: (user) => user.level >= 10
  }
];

async function checkAndAwardBadges(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const existingBadgeNames = new Set(user.badges.map(b => b.name));
    const newBadges = [];

    for (const def of BADGE_DEFINITIONS) {
      if (existingBadgeNames.has(def.name)) continue;
      if (def.check(user)) {
        user.badges.push({
          name: def.name,
          description: def.description,
          icon: def.icon,
          earnedAt: new Date()
        });
        newBadges.push(def);
      }
    }

    if (newBadges.length > 0) {
      await user.save();
      for (const badge of newBadges) {
        await notifyBadgeEarned(userId, badge.name, badge.icon);
      }
    }

    return newBadges;
  } catch (err) {
    console.error('Badge check error:', err.message);
    return [];
  }
}

async function awardPointsAndSync(userId, pointsToAdd) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const oldLevel = user.level;
    user.points += pointsToAdd;
    user.calculateLevel();

    await user.save();

    if (user.level > oldLevel) {
      await notifyLevelUp(userId, user.level);
    }

    await checkAndAwardBadges(userId);

    return user;
  } catch (err) {
    console.error('Award points error:', err.message);
    return null;
  }
}

function getBadgeCatalog() {
  return BADGE_DEFINITIONS.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    icon: d.icon
  }));
}

module.exports = {
  BADGE_DEFINITIONS,
  checkAndAwardBadges,
  awardPointsAndSync,
  getBadgeCatalog
};
