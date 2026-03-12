import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('artdrive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // DEV MODE: Add dev headers if in dev mode
    if (API_CONFIG.AUTH_MODE === 'DEV') {
      const devUser = localStorage.getItem('artdrive_dev_user');
      if (devUser) {
        const user = JSON.parse(devUser);
        config.headers['X-Dev-User-Id'] = user.id;
        config.headers['X-Dev-User-Role'] = user.role;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 - Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('artdrive_token');
        localStorage.removeItem('artdrive_user');
        localStorage.removeItem('artdrive_dev_user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getConfig: () => api.get('/auth/config'),
  createTestUsers: () => api.post('/auth/dev/create-test-users')
};

// User API
export const userAPI = {
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getPhotographers: (params) => api.get('/users/photographers', { params }),
  getLeaderboard: (params) => api.get('/users/leaderboard', { params }),

  // Portfolio endpoints
  addToPortfolio: (formData) => {
    return api.post('/users/portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updatePortfolioPhoto: (photoId, data) => api.put(`/users/portfolio/${photoId}`, data),
  removeFromPortfolio: (photoId) => api.delete(`/users/portfolio/${photoId}`),

  // Avatar upload
  uploadAvatar: (formData) => {
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Tournament API
export const tournamentAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  getLive: () => api.get('/tournaments/status/live'),
  getUpcoming: () => api.get('/tournaments/status/upcoming'),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  register: (id, formData) => api.post(`/tournaments/${id}/register`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  vote: (tournamentId, participantId) => api.post(`/tournaments/${tournamentId}/vote/${participantId}`),
  skip: (tournamentId, participantId) => api.post(`/tournaments/${tournamentId}/skip/${participantId}`),
  start: (tournamentId) => api.post(`/tournaments/${tournamentId}/start`),
  getVoteProgress: (tournamentId) => api.get(`/tournaments/${tournamentId}/vote-progress`),
  getLeaderboard: (id, params) => api.get(`/tournaments/${id}/leaderboard`, { params })
};

// Job API
export const jobAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  getMyJobs: (params) => api.get('/jobs/my-jobs/list', { params }),
  getMyApplications: () => api.get('/jobs/my-applications'),
  apply: (id, data) => api.post(`/jobs/${id}/apply`, data),
  getApplications: (id) => api.get(`/jobs/${id}/applications`),
  updateApplicationStatus: (jobId, applicationId, status) => 
    api.patch(`/jobs/${jobId}/applications/${applicationId}`, { status }),
  updateStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }),
  delete: (id) => api.delete(`/jobs/${id}`)
};

// Helper to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Build full URL from backend
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${baseUrl}/${cleanPath}`;
};

export default api;
