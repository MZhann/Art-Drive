// API Configuration
// AUTH_MODE: 'DEV' uses localStorage, 'PROD' uses real backend

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  AUTH_MODE: process.env.REACT_APP_AUTH_MODE || 'PROD', // 'DEV' or 'PROD'
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
};

export const ROLES = {
  PHOTOGRAPHER: 'photographer',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
  JUDGE: 'judge'
};

export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  UPCOMING: 'upcoming',
  REGISTRATION: 'registration',
  LIVE: 'live',
  VOTING: 'voting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TOURNAMENT_CATEGORIES = [
  { value: 'abstract', label: 'Abstract Art' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'street', label: 'Street Photography' },
  { value: 'nature', label: 'Nature' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'sports', label: 'Sports' },
  { value: 'wildlife', label: 'Wildlife' },
  { value: 'macro', label: 'Macro' },
  { value: 'cyberpunk', label: 'Cyber Punk' },
  { value: 'character', label: 'Character Art' },
  { value: 'other', label: 'Other' }
];

export default API_CONFIG;

