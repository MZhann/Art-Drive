import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_CONFIG, ROLES } from '../config/api.config';
import { authAPI } from '../services/api.service';

const AuthContext = createContext(null);

// Mock users for DEV mode
const DEV_USERS = [
  {
    id: 'dev-photographer-1',
    email: 'photographer@test.com',
    username: 'test_photographer',
    fullName: 'Alex Photographer',
    role: ROLES.PHOTOGRAPHER,
    avatar: null,
    points: 1500,
    level: 2,
    isDevMode: true
  },
  {
    id: 'dev-employer-1',
    email: 'employer@test.com',
    username: 'test_employer',
    fullName: 'Maria Employer',
    role: ROLES.EMPLOYER,
    companyName: 'Creative Agency',
    avatar: null,
    isDevMode: true
  },
  {
    id: 'dev-admin-1',
    email: 'admin@test.com',
    username: 'admin',
    fullName: 'System Admin',
    role: ROLES.ADMIN,
    avatar: null,
    isDevMode: true
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState(API_CONFIG.AUTH_MODE);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        if (authMode === 'DEV') {
          // DEV MODE: Check localStorage for dev user
          const savedUser = localStorage.getItem('artdrive_dev_user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          }
        } else {
          // PROD MODE: Verify token with backend
          const token = localStorage.getItem('artdrive_token');
          if (token) {
            const response = await authAPI.getMe();
            if (response.data.success) {
              setUser(response.data.data.user);
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth data
        localStorage.removeItem('artdrive_token');
        localStorage.removeItem('artdrive_user');
        localStorage.removeItem('artdrive_dev_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [authMode]);

  // Register function
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    
    try {
      if (authMode === 'DEV') {
        // DEV MODE: Create user in localStorage
        const newUser = {
          id: `dev-user-${Date.now()}`,
          email: userData.email,
          username: userData.username,
          fullName: userData.fullName,
          role: userData.role || ROLES.PHOTOGRAPHER,
          avatar: null,
          points: 0,
          level: 1,
          isDevMode: true,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('artdrive_dev_user', JSON.stringify(newUser));
        localStorage.setItem('artdrive_token', `dev-token-${Date.now()}`);
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      } else {
        // PROD MODE: Call backend API
        const response = await authAPI.register(userData);
        
        if (response.data.success) {
          const { user, token } = response.data.data;
          localStorage.setItem('artdrive_token', token);
          localStorage.setItem('artdrive_user', JSON.stringify(user));
          
          setUser(user);
          setIsAuthenticated(true);
          
          return { success: true, user };
        }
        
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [authMode]);

  // Login function
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    
    try {
      if (authMode === 'DEV') {
        // DEV MODE: Check against mock users or stored user
        const devUser = DEV_USERS.find(u => u.email === email);
        
        if (devUser) {
          localStorage.setItem('artdrive_dev_user', JSON.stringify(devUser));
          localStorage.setItem('artdrive_token', `dev-token-${Date.now()}`);
          
          setUser(devUser);
          setIsAuthenticated(true);
          
          return { success: true, user: devUser };
        }
        
        // Check if user registered in dev mode before
        const savedUsers = JSON.parse(localStorage.getItem('artdrive_dev_users') || '[]');
        const savedUser = savedUsers.find(u => u.email === email);
        
        if (savedUser) {
          localStorage.setItem('artdrive_dev_user', JSON.stringify(savedUser));
          localStorage.setItem('artdrive_token', `dev-token-${Date.now()}`);
          
          setUser(savedUser);
          setIsAuthenticated(true);
          
          return { success: true, user: savedUser };
        }
        
        return { success: false, message: 'Invalid email or password. Try: photographer@test.com, employer@test.com, or admin@test.com' };
      } else {
        // PROD MODE: Call backend API
        const response = await authAPI.login({ email, password });
        
        if (response.data.success) {
          const { user, token } = response.data.data;
          localStorage.setItem('artdrive_token', token);
          localStorage.setItem('artdrive_user', JSON.stringify(user));
          
          setUser(user);
          setIsAuthenticated(true);
          
          return { success: true, user };
        }
        
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, [authMode]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (authMode !== 'DEV') {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('artdrive_token');
      localStorage.removeItem('artdrive_user');
      localStorage.removeItem('artdrive_dev_user');
      
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [authMode]);

  // Update user data
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    if (authMode === 'DEV') {
      localStorage.setItem('artdrive_dev_user', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('artdrive_user', JSON.stringify(updatedUser));
    }
  }, [user, authMode]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true; // Admin has all roles
    return user.role === role;
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === ROLES.ADMIN;
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    authMode,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isDevMode: authMode === 'DEV'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

