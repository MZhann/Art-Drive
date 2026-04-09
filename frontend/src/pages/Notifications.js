import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../services/api.service';
import { 
  Bell, Trophy, Briefcase, Heart, Award, TrendingUp, 
  CheckCircle, XCircle, Star, Trash2, CheckCheck
} from 'lucide-react';
import './Notifications.css';

const ICON_MAP = {
  vote_received: { icon: Heart, color: '#ef4444' },
  tournament_reminder: { icon: Bell, color: '#f59e0b' },
  tournament_started: { icon: Trophy, color: '#a855f7' },
  tournament_won: { icon: Trophy, color: '#eab308' },
  tournament_completed: { icon: Trophy, color: '#6b7280' },
  badge_earned: { icon: Award, color: '#a855f7' },
  level_up: { icon: TrendingUp, color: '#22c55e' },
  job_application: { icon: Briefcase, color: '#3b82f6' },
  job_accepted: { icon: CheckCircle, color: '#22c55e' },
  job_rejected: { icon: XCircle, color: '#ef4444' },
  job_completed: { icon: Star, color: '#eab308' },
  points_earned: { icon: Star, color: '#f59e0b' },
  system: { icon: Bell, color: '#6b7280' }
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAll({ page: p, limit: 20 });
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [fetchNotifications, page]);

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await notificationAPI.markAsRead(notif._id);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    }
    const link = notif.data?.link;
    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await notificationAPI.delete(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-summary">{unreadCount} unread</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="notifications-loading">
            <div className="spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <Bell size={64} className="empty-icon" />
            <h3>No notifications yet</h3>
            <p>When you receive votes, badges, or updates, they'll appear here.</p>
          </div>
        ) : (
          <>
            <div className="notifications-list">
              <AnimatePresence>
                {notifications.map((notif) => {
                  const config = ICON_MAP[notif.type] || ICON_MAP.system;
                  const IconComp = config.icon;
                  return (
                    <motion.div
                      key={notif._id}
                      className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
                      onClick={() => handleClick(notif)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="notif-icon" style={{ background: `${config.color}20`, color: config.color }}>
                        {notif.data?.badgeIcon ? (
                          <span className="notif-emoji">{notif.data.badgeIcon}</span>
                        ) : (
                          <IconComp size={20} />
                        )}
                      </div>
                      <div className="notif-body">
                        <p className="notif-title">{notif.title}</p>
                        <p className="notif-message">{notif.message}</p>
                        <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <button className="notif-delete" onClick={(e) => handleDelete(e, notif._id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                      {!notif.isRead && <div className="notif-unread-dot" />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="notifications-pagination">
                <button 
                  className="btn btn-outline btn-sm" 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button 
                  className="btn btn-outline btn-sm" 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
