import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, getImageUrl } from '../services/api.service';
import { toast } from 'react-hot-toast';
import { 
  Camera, 
  MapPin, 
  Link as LinkIcon, 
  Instagram, 
  Star,
  Trophy,
  Edit,
  Share2,
  Calendar,
  Plus,
  X,
  Upload,
  Trash2,
  Save,
  Image as ImageIcon,
  Loader
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const isOwnProfile = isAuthenticated && currentUser?.username === username;

  // Prompt login for interactions when not authenticated
  const requireAuth = (action) => {
    if (!isAuthenticated) {
      toast.error(`Please login to ${action}`);
      navigate('/login');
      return false;
    }
    return true;
  };

  // Fetch user profile from API
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getByUsername(username);
      if (response.data.success) {
        setProfileUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 404) {
        setProfileUser(null);
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle portfolio photo upload
  const handleUploadPhoto = async (uploadData) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);

      const response = await userAPI.addToPortfolio(formData);
      
      if (response.data.success) {
        toast.success('Photo added to portfolio!');
        setShowUploadModal(false);
        // Refresh profile
        await fetchProfile();
        // Update auth context user if it's own profile
        if (isOwnProfile && currentUser) {
          updateUser({ 
            portfolio: response.data.data.portfolio,
            stats: { ...currentUser.stats, totalPhotosUploaded: (currentUser.stats?.totalPhotosUploaded || 0) + 1 }
          });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload photo';
      toast.error(message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle portfolio photo deletion
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    setDeleteLoading(photoId);
    try {
      const response = await userAPI.removeFromPortfolio(photoId);
      
      if (response.data.success) {
        toast.success('Photo removed from portfolio');
        await fetchProfile();
        setSelectedPhoto(null);
      }
    } catch (error) {
      toast.error('Failed to delete photo');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setProfileUser(response.data.data.user);
        setShowEditProfileModal(false);
        if (isOwnProfile) {
          updateUser(response.data.data.user);
        }
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await userAPI.uploadAvatar(formData);
      
      if (response.data.success) {
        toast.success('Avatar updated!');
        await fetchProfile();
        if (isOwnProfile) {
          updateUser({ avatar: response.data.data.avatar });
        }
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="not-found">
        <h2>User not found</h2>
        <p className="text-secondary">The user @{username} doesn't exist</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="container">
          <motion.div 
            className="profile-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="profile-main">
              <div className="avatar-section">
                <div className="profile-avatar">
                  {profileUser.avatar ? (
                    <img src={getImageUrl(profileUser.avatar)} alt={profileUser.fullName} />
                  ) : (
                    <span>{profileUser.fullName?.charAt(0) || '?'}</span>
                  )}
                  {isOwnProfile && (
                    <AvatarUploadButton onUpload={handleAvatarUpload} />
                  )}
                </div>
                <div className="level-badge">
                  <Star size={12} />
                  Level {profileUser.level || 1}
                </div>
              </div>

              <div className="profile-info">
                <h1>{profileUser.fullName}</h1>
                <p className="username">@{profileUser.username}</p>
                
                {profileUser.bio && (
                  <p className="bio">{profileUser.bio}</p>
                )}

                <div className="profile-meta">
                  {profileUser.location?.city && (
                    <span className="meta-item">
                      <MapPin size={14} />
                      {profileUser.location.city}, {profileUser.location.country}
                    </span>
                  )}
                  <span className="meta-item">
                    <Calendar size={14} />
                    Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Social Links */}
                <div className="social-links">
                  {profileUser.socialLinks?.instagram && (
                    <a href={`https://instagram.com/${profileUser.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="social-link">
                      <Instagram size={18} />
                    </a>
                  )}
                  {profileUser.socialLinks?.website && (
                    <a href={`https://${profileUser.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="social-link">
                      <LinkIcon size={18} />
                    </a>
                  )}
                </div>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <button 
                    className="btn btn-outline"
                    onClick={() => setShowEditProfileModal(true)}
                  >
                    <Edit size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        if (requireAuth('follow this photographer')) {
                          toast.success('Follow feature coming soon!');
                        }
                      }}
                    >
                      Follow
                    </button>
                    <button 
                      className="btn btn-outline icon-only"
                      onClick={() => {
                        // Share is public — copy profile link
                        navigator.clipboard.writeText(window.location.href)
                          .then(() => toast.success('Profile link copied to clipboard!'))
                          .catch(() => toast.error('Failed to copy link'));
                      }}
                    >
                      <Share2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{(profileUser.points || 0).toLocaleString()}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats?.tournamentsJoined || 0}</span>
                <span className="stat-label">Tournaments</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats?.tournamentsWon || 0}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{(profileUser.stats?.totalVotesReceived || 0).toLocaleString()}</span>
                <span className="stat-label">Votes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{profileUser.stats?.totalPhotosUploaded || 0}</span>
                <span className="stat-label">Photos</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Badges Section */}
        {profileUser.badges && profileUser.badges.length > 0 && (
          <motion.div 
            className="badges-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Badges & Achievements</h3>
            <div className="badges-row">
              {profileUser.badges.map((badge, index) => (
                <div key={index} className="badge-card">
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <Camera size={18} />
            Portfolio ({profileUser.portfolio?.length || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            <Trophy size={18} />
            Tournaments
          </button>
        </div>

        {/* Portfolio Grid */}
        {activeTab === 'portfolio' && (
          <motion.div 
            className="portfolio-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Upload button for own profile */}
            {isOwnProfile && profileUser.role === 'photographer' && (
              <div className="portfolio-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Plus size={18} />
                  Upload Photo
                </button>
              </div>
            )}

            {profileUser.portfolio && profileUser.portfolio.length > 0 ? (
              <div className="portfolio-grid">
                {profileUser.portfolio.map((photo, index) => (
                  <motion.div 
                    key={photo._id || index}
                    className="portfolio-item"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img 
                      src={getImageUrl(photo.imageUrl)} 
                      alt={photo.title || 'Portfolio photo'} 
                      loading="lazy"
                    />
                    <div className="portfolio-overlay">
                      <span className="photo-title">{photo.title || 'Untitled'}</span>
                      {isOwnProfile && (
                        <button 
                          className="photo-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo._id);
                          }}
                          disabled={deleteLoading === photo._id}
                        >
                          {deleteLoading === photo._id ? (
                            <Loader size={16} className="spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Camera size={48} className="empty-icon" />
                <p>{isOwnProfile ? 'Your portfolio is empty. Upload your first photo!' : 'No photos in portfolio yet'}</p>
                {isOwnProfile && profileUser.role === 'photographer' && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload size={16} />
                    Upload First Photo
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <motion.div 
            className="tournaments-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-state">
              <Trophy size={48} className="empty-icon" />
              <p>Tournament history coming soon</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadPhotoModal
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUploadPhoto}
            isLoading={uploadLoading}
          />
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <EditProfileModal
            user={profileUser}
            onClose={() => setShowEditProfileModal(false)}
            onSave={handleUpdateProfile}
          />
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoLightbox
            photo={selectedPhoto}
            isOwner={isOwnProfile}
            onClose={() => setSelectedPhoto(null)}
            onDelete={() => handleDeletePhoto(selectedPhoto._id)}
            deleteLoading={deleteLoading === selectedPhoto._id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================
   Sub-Components 
   ============================================ */

// Avatar Upload Button
const AvatarUploadButton = ({ onUpload }) => {
  const fileInputRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar must be less than 5MB');
        return;
      }
      onUpload(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <button className="avatar-upload-btn" onClick={handleClick} title="Change avatar">
        <Camera size={16} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
};

// Upload Photo Modal
const UploadPhotoModal = ({ onClose, onUpload, isLoading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an image');
      return;
    }
    onUpload({ file, title, description });
  };

  return (
    <motion.div 
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content upload-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Upload to Portfolio</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Drop Zone */}
          <div 
            className={`drop-zone ${preview ? 'has-preview' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" />
                <button 
                  type="button" 
                  className="remove-preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="drop-zone-content">
                <ImageIcon size={48} className="drop-icon" />
                <p>Drag & drop your image here</p>
                <span className="text-muted">or click to browse</span>
                <span className="drop-zone-hint">Max 10MB - JPEG, PNG, WebP</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Photo Details */}
          <div className="form-group">
            <label htmlFor="photo-title">Title</label>
            <input
              type="text"
              id="photo-title"
              className="input"
              placeholder="Give your photo a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="photo-description">Description</label>
            <textarea
              id="photo-description"
              className="input textarea"
              placeholder="Tell the story behind this photo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Edit Profile Modal
const EditProfileModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    bio: user.bio || '',
    city: user.location?.city || '',
    country: user.location?.country || 'Kazakhstan',
    instagram: user.socialLinks?.instagram || '',
    behance: user.socialLinks?.behance || '',
    website: user.socialLinks?.website || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    await onSave({
      fullName: formData.fullName,
      bio: formData.bio,
      location: {
        city: formData.city,
        country: formData.country
      },
      socialLinks: {
        instagram: formData.instagram,
        behance: formData.behance,
        website: formData.website
      }
    });
    
    setSaving(false);
  };

  return (
    <motion.div 
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content edit-profile-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              className="input"
              value={formData.fullName}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              className="input textarea"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                className="input"
                value={formData.city}
                onChange={handleChange}
                placeholder="Almaty"
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                className="input"
                value={formData.country}
                onChange={handleChange}
                placeholder="Kazakhstan"
              />
            </div>
          </div>

          <div className="form-divider">
            <span>Social Links</span>
          </div>

          <div className="form-group">
            <label>Instagram Username</label>
            <input
              type="text"
              name="instagram"
              className="input"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="your_instagram"
            />
          </div>

          <div className="form-group">
            <label>Behance Username</label>
            <input
              type="text"
              name="behance"
              className="input"
              value={formData.behance}
              onChange={handleChange}
              placeholder="yourbehance"
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              name="website"
              className="input"
              value={formData.website}
              onChange={handleChange}
              placeholder="yourwebsite.com"
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader size={16} className="spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Photo Lightbox
const PhotoLightbox = ({ photo, isOwner, onClose, onDelete, deleteLoading }) => {
  return (
    <motion.div 
      className="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="lightbox-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lightbox-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="lightbox-image">
          <img src={getImageUrl(photo.imageUrl)} alt={photo.title || 'Photo'} />
        </div>
        
        <div className="lightbox-info">
          <h3>{photo.title || 'Untitled'}</h3>
          {photo.description && <p>{photo.description}</p>}
          <span className="lightbox-date">
            {photo.uploadedAt && new Date(photo.uploadedAt).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
          
          {isOwner && (
            <div className="lightbox-actions">
              <button 
                className="btn btn-outline btn-danger"
                onClick={onDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader size={16} className="spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete Photo
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
