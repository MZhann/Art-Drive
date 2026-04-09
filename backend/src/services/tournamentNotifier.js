const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Tournament = require('../models/Tournament.model');
const User = require('../models/User.model');
const { notifyTournamentReminder, notifyTournamentWon } = require('./notificationService');
const { awardPointsAndSync, checkAndAwardBadges } = require('./badgeService');

let transporter = null;

function initTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('⚠️  SMTP not configured — tournament email reminders disabled.');
    console.log('   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env to enable.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port) || 587,
    secure: parseInt(port) === 465,
    auth: { user, pass }
  });
}

async function sendReminderEmails() {
  try {
    const now = new Date();
    const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000);
    const sixMinLater = new Date(now.getTime() + 6 * 60 * 1000);

    const tournaments = await Tournament.find({
      votingStart: { $gte: fiveMinLater, $lt: sixMinLater },
      status: { $in: ['registration', 'live', 'upcoming'] }
    });

    for (const tournament of tournaments) {
      if (!tournament.participants || tournament.participants.length === 0) continue;

      const userIds = tournament.participants.map(p => p.user);
      const users = await User.find({ _id: { $in: userIds } }).select('email fullName');

      for (const user of users) {
        notifyTournamentReminder(user._id, tournament.title, tournament._id);
      }

      if (!transporter) continue;

      const emailPromises = users.map(user => {
        if (!user.email) return Promise.resolve();

        const mailOptions = {
          from: `"ArtDrive" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Tournament "${tournament.title}" starts in 5 minutes!`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e0e0e0; padding: 32px; border-radius: 12px;">
              <h1 style="color: #a855f7; margin-bottom: 8px;">ArtDrive</h1>
              <h2 style="color: #ffffff; margin-top: 0;">Tournament Reminder</h2>
              <p>Hey <strong>${user.fullName}</strong>,</p>
              <p>The tournament <strong style="color: #a855f7;">"${tournament.title}"</strong> is starting in <strong>5 minutes</strong>!</p>
              <p><strong>Category:</strong> ${tournament.category}</p>
              <p><strong>Voting starts at:</strong> ${tournament.votingStart.toLocaleString()}</p>
              <div style="margin-top: 24px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tournaments/${tournament._id}"
                   style="background: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  View Tournament
                </a>
              </div>
              <p style="margin-top: 32px; color: #888; font-size: 12px;">
                You received this because you're registered for this tournament on ArtDrive.
              </p>
            </div>
          `
        };

        return transporter.sendMail(mailOptions).catch(err => {
          console.error(`Failed to send email to ${user.email}:`, err.message);
        });
      });

      await Promise.all(emailPromises);
      console.log(`📧 Sent reminder emails for tournament "${tournament.title}" to ${users.length} participants`);
    }
  } catch (error) {
    console.error('Tournament notification error:', error);
  }
}

async function finalizeTournaments() {
  try {
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60 * 1000);

    const tournaments = await Tournament.find({
      votingEnd: { $gte: oneMinAgo, $lt: now },
      status: { $ne: 'completed' }
    }).populate('participants.user', 'fullName');

    for (const tournament of tournaments) {
      tournament.status = 'completed';

      if (tournament.participants.length === 0) {
        await tournament.save();
        continue;
      }

      const sorted = [...tournament.participants].sort((a, b) => b.votes - a.votes);

      const prizePoints = tournament.prizes?.points || 10;
      const prizeDistribution = [
        { position: 1, multiplier: 1.0 },
        { position: 2, multiplier: 0.6 },
        { position: 3, multiplier: 0.3 }
      ];

      const winners = [];
      for (const dist of prizeDistribution) {
        const participant = sorted[dist.position - 1];
        if (!participant || participant.votes === 0) continue;

        const earnedPoints = Math.round(prizePoints * dist.multiplier);
        const userId = participant.user._id || participant.user;

        winners.push({
          position: dist.position,
          user: userId,
          prize: `${earnedPoints} points`
        });

        participant.rank = dist.position;

        await awardPointsAndSync(userId, earnedPoints);

        if (dist.position === 1) {
          await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.tournamentsWon': 1 }
          });

          if (tournament.prizes?.badge?.name) {
            const user = await User.findById(userId);
            const hasBadge = user.badges.some(b => b.name === tournament.prizes.badge.name);
            if (!hasBadge) {
              user.badges.push({
                name: tournament.prizes.badge.name,
                description: tournament.prizes.badge.description || `Winner of ${tournament.title}`,
                icon: tournament.prizes.badge.icon || '🏆',
                earnedAt: new Date()
              });
              await user.save();
            }
          }

          await checkAndAwardBadges(userId);
        }

        await notifyTournamentWon(userId, tournament.title, tournament._id, dist.position, earnedPoints);
      }

      tournament.winners = winners;
      await tournament.save();

      console.log(`🏁 Finalized tournament "${tournament.title}" with ${winners.length} winners`);
    }
  } catch (error) {
    console.error('Tournament finalization error:', error);
  }
}

function startTournamentNotifier() {
  transporter = initTransporter();

  cron.schedule('* * * * *', () => {
    sendReminderEmails();
    finalizeTournaments();
  });

  console.log('🔔 Tournament notification & finalization scheduler started');
}

module.exports = { startTournamentNotifier };
