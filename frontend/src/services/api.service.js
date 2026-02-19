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
        if (window.location.pathname !== '/login') {
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
  addToPortfolio: (data) => api.post('/users/portfolio', data),
  removeFromPortfolio: (photoId) => api.delete(`/users/portfolio/${photoId}`)
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
  register: (id, data) => api.post(`/tournaments/${id}/register`, data),
  vote: (tournamentId, participantId) => api.post(`/tournaments/${tournamentId}/vote/${participantId}`),
  getLeaderboard: (id, params) => api.get(`/tournaments/${id}/leaderboard`, { params })
};

export default api;

