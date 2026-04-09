import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userAPI, getImageUrl } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Medal, Star, TrendingUp, Crown } from 'lucide-react';
import './Leaderboard.css';

const RANK_STYLES = {
  1: { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', icon: Crown, label: '1st' },
  2: { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', icon: Medal, label: '2nd' },
  3: { bg: 'linear-gradient(135deg, #d97706, #b45309)', icon: Medal, label: '3rd' }
};

const Leaderboard = () => {
  const { user: currentUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await userAPI.getLeaderboard({ limit: 50 });
        if (res.data.success) {
          setLeaders(res.data.data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="container">
          <div className="leaderboard-loading">
            <div className="spinner" />
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="leaderboard-hero">
          <Trophy size={32} className="hero-icon" />
          <h1>Leaderboard</h1>
          <p>Top photographers ranked by points</p>
        </div>

        {top3.length > 0 && (
          <div className="podium">
            {[1, 0, 2].map((idx) => {
              const entry = top3[idx];
              if (!entry) return <div key={idx} className="podium-slot empty" />;
              const rankStyle = RANK_STYLES[entry.rank];
              const RankIcon = rankStyle?.icon || Star;
              const isMe = currentUser?.username === entry.username;
              return (
                <motion.div
                  key={entry._id}
                  className={`podium-card rank-${entry.rank} ${isMe ? 'is-me' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <div className="podium-rank" style={{ background: rankStyle?.bg }}>
                    <RankIcon size={16} />
                    {rankStyle?.label}
                  </div>
                  <Link to={`/profile/${entry.username}`} className="podium-avatar">
                    {entry.avatar ? (
                      <img src={getImageUrl(entry.avatar)} alt={entry.fullName} />
                    ) : (
                      <span>{entry.fullName?.charAt(0)}</span>
                    )}
                  </Link>
                  <Link to={`/profile/${entry.username}`} className="podium-name">
                    {entry.fullName}
                  </Link>
                  <span className="podium-username">@{entry.username}</span>
                  <div className="podium-stats">
                    <span className="podium-points">
                      <Star size={14} /> {entry.points} pts
                    </span>
                    <span className="podium-level">
                      <TrendingUp size={14} /> Lvl {entry.level}
                    </span>
                  </div>
                  {entry.badges?.length > 0 && (
                    <div className="podium-badges">
                      {entry.badges.slice(0, 3).map((b, i) => (
                        <span key={i} className="mini-badge" title={b.name}>{b.icon}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && (
          <div className="leaderboard-table">
            <div className="table-header">
              <span className="col-rank">Rank</span>
              <span className="col-user">Photographer</span>
              <span className="col-badges">Badges</span>
              <span className="col-level">Level</span>
              <span className="col-wins">Wins</span>
              <span className="col-points">Points</span>
            </div>
            {rest.map((entry, i) => {
              const isMe = currentUser?.username === entry.username;
              return (
                <motion.div
                  key={entry._id}
                  className={`table-row ${isMe ? 'is-me' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span className="col-rank">#{entry.rank}</span>
                  <Link to={`/profile/${entry.username}`} className="col-user">
                    <div className="row-avatar">
                      {entry.avatar ? (
                        <img src={getImageUrl(entry.avatar)} alt="" />
                      ) : (
                        <span>{entry.fullName?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <span className="row-name">{entry.fullName}</span>
                      <span className="row-username">@{entry.username}</span>
                    </div>
                  </Link>
                  <span className="col-badges">
                    {entry.badges?.slice(0, 4).map((b, j) => (
                      <span key={j} className="mini-badge" title={b.name}>{b.icon}</span>
                    ))}
                  </span>
                  <span className="col-level">{entry.level}</span>
                  <span className="col-wins">{entry.stats?.tournamentsWon || 0}</span>
                  <span className="col-points">{entry.points}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {leaders.length === 0 && (
          <div className="leaderboard-empty">
            <Trophy size={64} className="empty-icon" />
            <h3>No rankings yet</h3>
            <p>Start competing in tournaments to appear on the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
