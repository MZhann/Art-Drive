import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Camera, Zap, ArrowRight, Star } from 'lucide-react';
import './Home.css';

// Mock featured tournaments (matching your design)
const featuredTournaments = [
  {
    id: '1',
    title: 'Abstract Art',
    category: 'abstract',
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    prizeFund: { amount: 7000, currency: 'USD' },
    stats: { totalViews: 15000, totalParticipants: 500 },
    isHot: true,
    sponsorGift: {
      title: 'MIDJOURNEY 1 YEAR SUBSCRIPTION',
      description: 'sponsor gift'
    },
    registrationEnd: new Date(Date.now() + 18 * 60 * 60 * 1000 + 15 * 60 * 1000 + 35 * 1000)
  },
  {
    id: '2',
    title: 'Cyber Punk Art',
    category: 'cyberpunk',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    prizeFund: { amount: 7000, currency: 'USD' },
    stats: { totalViews: 1500 },
  },
  {
    id: '3',
    title: 'Character Art',
    category: 'character',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    prizeFund: { amount: 1000, currency: 'USD' },
    stats: { totalViews: 15000 },
  }
];

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-badge">
              <Zap size={14} />
              <span>Kazakhstan's Premier Photography Platform</span>
            </div>
            <h1 className="hero-title">
              Compete. Create.
              <span className="text-gradient"> Conquer.</span>
            </h1>
            <p className="hero-description">
              Join real-time photography tournaments, build your portfolio, 
              and connect with the creative community. Win prizes, earn recognition, 
              and turn your passion into a profession.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Competing
                <ArrowRight size={20} />
              </Link>
              <Link to="/tournaments" className="btn btn-outline btn-lg">
                Browse Tournaments
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">10K+</span>
                <span className="stat-label">Photographers</span>
              </div>
              <div className="stat">
                <span className="stat-value">500+</span>
                <span className="stat-label">Tournaments</span>
              </div>
              <div className="stat">
                <span className="stat-value">$100K+</span>
                <span className="stat-label">Prizes Awarded</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="hero-bg">
          <div className="hero-gradient"></div>
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
      </section>

      {/* Featured Tournament */}
      <section className="featured-section">
        <div className="container">
          <motion.div
            className="featured-tournament"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="featured-image">
              <img src={featuredTournaments[0].coverImage} alt={featuredTournaments[0].title} />
              <div className="featured-overlay">
                <h2 className="featured-title">
                  {featuredTournaments[0].title.split(' ').map((word, i) => (
                    <span key={i}>{word}</span>
                  ))}
                </h2>
              </div>
            </div>
            
            <div className="featured-info">
              <div className="featured-countdown">
                <p className="countdown-label">register until:</p>
                <div className="countdown-timer">
                  <div className="countdown-item">
                    <span className="countdown-value">18</span>
                    <span className="countdown-unit">hour</span>
                  </div>
                  <div className="countdown-separator">|</div>
                  <div className="countdown-item">
                    <span className="countdown-value">15</span>
                    <span className="countdown-unit">min</span>
                  </div>
                  <div className="countdown-separator">|</div>
                  <div className="countdown-item">
                    <span className="countdown-value">35</span>
                    <span className="countdown-unit">sec</span>
                  </div>
                </div>
              </div>

              <div className="featured-buttons">
                <div className="register-option">
                  <span className="register-label">REGISTER AS A</span>
                  <Link to="/register" className="btn btn-primary">
                    Contestant
                  </Link>
                </div>
                <div className="register-option">
                  <span className="register-label">REGISTER AS A</span>
                  <Link to="/register" className="btn btn-secondary">
                    Judge
                  </Link>
                </div>
              </div>

              <h3 className="tournament-name">Art Drive Tournament</h3>

              <div className="sponsor-gift">
                <span className="hot-badge">HOT</span>
                <div className="gift-info">
                  <h4>{featuredTournaments[0].sponsorGift.title}</h4>
                  <p>{featuredTournaments[0].sponsorGift.description}</p>
                </div>
              </div>

              <div className="tournament-stats">
                <div className="stat-item">
                  <span className="stat-amount">{featuredTournaments[0].prizeFund.amount}$</span>
                  <span className="stat-desc">prize fund</span>
                </div>
                <div className="stat-item">
                  <span className="stat-amount">{featuredTournaments[0].stats.totalViews.toLocaleString()}</span>
                  <span className="stat-desc">audience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-amount">{featuredTournaments[0].stats.totalParticipants}</span>
                  <span className="stat-desc">participants</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tournament List Preview */}
      <section className="tournaments-preview">
        <div className="container">
          <div className="section-header">
            <h2>Live Tournaments</h2>
            <div className="filter-tabs">
              <button className="filter-tab active">Live</button>
              <button className="filter-tab">Upcoming</button>
              <button className="filter-tab">Past</button>
            </div>
          </div>

          <div className="tournament-list">
            {featuredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                className="tournament-card-horizontal"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="tournament-thumb">
                  <img src={tournament.coverImage} alt={tournament.title} />
                </div>
                <div className="tournament-content">
                  <h3>{tournament.title}</h3>
                  <p className="tournament-date">12 apr 2024</p>
                </div>
                <div className="tournament-prize">
                  <span className="prize-amount">{tournament.prizeFund.amount}$</span>
                  <span className="prize-label">prize fund</span>
                </div>
                <div className="tournament-audience">
                  <span className="audience-count">{tournament.stats.totalViews?.toLocaleString() || '0'}</span>
                  <span className="audience-label">audience</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="section-footer">
            <Link to="/tournaments" className="btn btn-outline">
              View All Tournaments
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.div
            className="section-header centered"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Why Choose <span className="text-gradient">ArtDrive</span>?</h2>
            <p className="text-secondary">
              The ultimate platform for photographers in Kazakhstan
            </p>
          </motion.div>

          <div className="features-grid">
            {[
              {
                icon: Trophy,
                title: 'Real-Time Tournaments',
                description: 'Compete in live photography competitions with instant voting and leaderboards'
              },
              {
                icon: Camera,
                title: 'Professional Portfolio',
                description: 'Showcase your work with a beautiful, shareable portfolio page'
              },
              {
                icon: Users,
                title: 'Job Marketplace',
                description: 'Connect with employers and find photography gigs that match your style'
              },
              {
                icon: Star,
                title: 'Gamification & Rewards',
                description: 'Earn points, badges, and climb the leaderboard as you compete'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="feature-icon">
                  <feature.icon size={28} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Start Your Journey?</h2>
            <p>Join thousands of photographers competing for recognition and prizes</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

