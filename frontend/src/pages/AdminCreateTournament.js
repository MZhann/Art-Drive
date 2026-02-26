import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { tournamentAPI } from '../services/api.service';
import { TOURNAMENT_CATEGORIES } from '../config/api.config';
import {
  Trophy,
  ArrowLeft,
  Award,
  Star,
  Newspaper,
  FileText,
  Users,
  Calendar,
  Tag,
  Image,
  Save,
  AlertCircle
} from 'lucide-react';
import './AdminCreateTournament.css';

const AdminCreateTournament = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper: get a date string N days from now in local datetime-local format
  const getDateFromNow = (days, hours = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours, 0, 0, 0);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'abstract',
    maxParticipants: 100,
    rules: '',
    coverImage: '',
    registrationStart: getDateFromNow(0),
    registrationEnd: getDateFromNow(7),
    votingStart: getDateFromNow(7, 1),
    votingEnd: getDateFromNow(14),
    // Prizes - predefined defaults
    prizesPoints: 10,
    prizesBadgeName: 'Tournament Winner',
    prizesBadgeIcon: '🏆',
    prizesNewsPageDays: 2,
    prizesAdditional: '',
    // Optional
    tags: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title || formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!formData.maxParticipants || formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'At least 2 participants required';
    }
    if (!formData.registrationStart) {
      newErrors.registrationStart = 'Registration start date is required';
    }
    if (!formData.registrationEnd) {
      newErrors.registrationEnd = 'Registration end date is required';
    }
    if (!formData.votingStart) {
      newErrors.votingStart = 'Voting start date is required';
    }
    if (!formData.votingEnd) {
      newErrors.votingEnd = 'Voting end date is required';
    }

    // Date order validation
    if (formData.registrationStart && formData.registrationEnd) {
      if (new Date(formData.registrationEnd) <= new Date(formData.registrationStart)) {
        newErrors.registrationEnd = 'Registration end must be after registration start';
      }
    }
    if (formData.votingStart && formData.registrationEnd) {
      if (new Date(formData.votingStart) < new Date(formData.registrationEnd)) {
        newErrors.votingStart = 'Voting start must be after registration ends';
      }
    }
    if (formData.votingStart && formData.votingEnd) {
      if (new Date(formData.votingEnd) <= new Date(formData.votingStart)) {
        newErrors.votingEnd = 'Voting end must be after voting start';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        coverImage: formData.coverImage || '',
        maxParticipants: formData.maxParticipants,
        rules: formData.rules,
        registrationStart: new Date(formData.registrationStart).toISOString(),
        registrationEnd: new Date(formData.registrationEnd).toISOString(),
        votingStart: new Date(formData.votingStart).toISOString(),
        votingEnd: new Date(formData.votingEnd).toISOString(),
        prizes: {
          points: formData.prizesPoints,
          badge: {
            name: formData.prizesBadgeName,
            description: `Winner of ${formData.title}`,
            icon: formData.prizesBadgeIcon
          },
          newsPageDays: formData.prizesNewsPageDays,
          additionalPrizes: formData.prizesAdditional
        },
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      const response = await tournamentAPI.create(payload);

      if (response.data.success) {
        toast.success('Tournament created successfully!');
        navigate(`/tournaments/${response.data.data.tournament._id}`);
      } else {
        toast.error(response.data.message || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Create tournament error:', error);
      const message = error.response?.data?.message || 'Failed to create tournament';
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        toast.error(validationErrors.map(e => e.msg).join(', '));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-create-tournament-page">
      <div className="container">
        {/* Header */}
        <motion.div
          className="page-header-admin"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="header-content">
            <h1>
              <Trophy size={28} />
              Create New Tournament
            </h1>
            <p className="text-secondary">
              Set up a new photography competition for the ArtDrive community
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          className="create-tournament-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Basic Info Section */}
          <div className="form-section">
            <h2 className="section-title">
              <FileText size={20} />
              Basic Information
            </h2>

            <div className="form-group">
              <label htmlFor="title">Tournament Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Abstract Art Challenge"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
              />
              {errors.title && <span className="error-text"><AlertCircle size={14} /> {errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Describe the tournament theme, what participants should submit..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
              />
              <span className="char-count">{formData.description.length}/2000</span>
              {errors.description && <span className="error-text"><AlertCircle size={14} /> {errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  className="form-input"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {TOURNAMENT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="maxParticipants">
                  <Users size={16} />
                  Max Contestants *
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  className={`form-input ${errors.maxParticipants ? 'error' : ''}`}
                  value={formData.maxParticipants}
                  onChange={handleNumberChange}
                  min={2}
                  max={10000}
                />
                {errors.maxParticipants && <span className="error-text"><AlertCircle size={14} /> {errors.maxParticipants}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="coverImage">
                <Image size={16} />
                Cover Image URL (optional)
              </label>
              <input
                type="url"
                id="coverImage"
                name="coverImage"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={formData.coverImage}
                onChange={handleChange}
              />
              <span className="form-hint">Paste a URL to an image. Leave blank for a default cover.</span>
            </div>

            <div className="form-group">
              <label htmlFor="tags">
                <Tag size={16} />
                Tags (comma separated, optional)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="form-input"
                placeholder="e.g. abstract, creative, challenge"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Rules Section */}
          <div className="form-section">
            <h2 className="section-title">
              <FileText size={20} />
              Tournament Rules
            </h2>

            <div className="form-group">
              <label htmlFor="rules">Rules &amp; Guidelines</label>
              <textarea
                id="rules"
                name="rules"
                className="form-input form-textarea"
                placeholder={"1. Each participant can submit only one photo\n2. Photos must be original work\n3. No AI-generated images\n4. Minimum resolution: 1920x1080\n5. Editing is allowed but must be disclosed"}
                value={formData.rules}
                onChange={handleChange}
                rows={6}
                maxLength={5000}
              />
              <span className="char-count">{formData.rules.length}/5000</span>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="form-section">
            <h2 className="section-title">
              <Calendar size={20} />
              Schedule
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="registrationStart">Registration Start *</label>
                <input
                  type="datetime-local"
                  id="registrationStart"
                  name="registrationStart"
                  className={`form-input ${errors.registrationStart ? 'error' : ''}`}
                  value={formData.registrationStart}
                  onChange={handleChange}
                />
                {errors.registrationStart && <span className="error-text"><AlertCircle size={14} /> {errors.registrationStart}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="registrationEnd">Registration End *</label>
                <input
                  type="datetime-local"
                  id="registrationEnd"
                  name="registrationEnd"
                  className={`form-input ${errors.registrationEnd ? 'error' : ''}`}
                  value={formData.registrationEnd}
                  onChange={handleChange}
                />
                {errors.registrationEnd && <span className="error-text"><AlertCircle size={14} /> {errors.registrationEnd}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="votingStart">Voting Start *</label>
                <input
                  type="datetime-local"
                  id="votingStart"
                  name="votingStart"
                  className={`form-input ${errors.votingStart ? 'error' : ''}`}
                  value={formData.votingStart}
                  onChange={handleChange}
                />
                {errors.votingStart && <span className="error-text"><AlertCircle size={14} /> {errors.votingStart}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="votingEnd">Voting End *</label>
                <input
                  type="datetime-local"
                  id="votingEnd"
                  name="votingEnd"
                  className={`form-input ${errors.votingEnd ? 'error' : ''}`}
                  value={formData.votingEnd}
                  onChange={handleChange}
                />
                {errors.votingEnd && <span className="error-text"><AlertCircle size={14} /> {errors.votingEnd}</span>}
              </div>
            </div>
          </div>

          {/* Prizes Section */}
          <div className="form-section prizes-section">
            <h2 className="section-title">
              <Award size={20} />
              Winner Prizes
            </h2>

            <div className="prizes-preview">
              <div className="prize-card">
                <div className="prize-icon-wrap">
                  <Star size={24} />
                </div>
                <div className="prize-details">
                  <h4>{formData.prizesPoints} Points</h4>
                  <p>Awarded to the winner's account</p>
                </div>
              </div>
              <div className="prize-card">
                <div className="prize-icon-wrap badge-icon">
                  <span className="prize-emoji">{formData.prizesBadgeIcon}</span>
                </div>
                <div className="prize-details">
                  <h4>{formData.prizesBadgeName || 'Winner Badge'}</h4>
                  <p>Displayed on winner's profile</p>
                </div>
              </div>
              <div className="prize-card">
                <div className="prize-icon-wrap news-icon">
                  <Newspaper size={24} />
                </div>
                <div className="prize-details">
                  <h4>{formData.prizesNewsPageDays} Days in News</h4>
                  <p>Featured on the homepage news</p>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prizesPoints">Winner Points</label>
                <input
                  type="number"
                  id="prizesPoints"
                  name="prizesPoints"
                  className="form-input"
                  value={formData.prizesPoints}
                  onChange={handleNumberChange}
                  min={0}
                  max={10000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prizesBadgeName">Badge Name</label>
                <input
                  type="text"
                  id="prizesBadgeName"
                  name="prizesBadgeName"
                  className="form-input"
                  placeholder="e.g. Tournament Winner"
                  value={formData.prizesBadgeName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prizesBadgeIcon">Badge Icon</label>
                <input
                  type="text"
                  id="prizesBadgeIcon"
                  name="prizesBadgeIcon"
                  className="form-input"
                  placeholder="🏆"
                  value={formData.prizesBadgeIcon}
                  onChange={handleChange}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prizesNewsPageDays">Days Featured in News Page</label>
              <input
                type="number"
                id="prizesNewsPageDays"
                name="prizesNewsPageDays"
                className="form-input"
                value={formData.prizesNewsPageDays}
                onChange={handleNumberChange}
                min={0}
                max={30}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prizesAdditional">Additional Prizes (optional)</label>
              <textarea
                id="prizesAdditional"
                name="prizesAdditional"
                className="form-input form-textarea"
                placeholder="e.g. Midjourney 1 Year Subscription, Camera lens, etc."
                value={formData.prizesAdditional}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminCreateTournament;

