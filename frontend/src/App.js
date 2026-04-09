import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import TournamentVoting from './pages/TournamentVoting';
import Profile from './pages/Profile';
import Photographers from './pages/Photographers';
import AdminCreateTournament from './pages/AdminCreateTournament';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import EmployerDashboard from './pages/EmployerDashboard';
import MyApplications from './pages/MyApplications';
import GlobalChat from './pages/GlobalChat';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';

// Loading component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading ArtDrive...</p>
    </div>
    <style>{`
      .loading-screen {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-bg-primary);
      }
      .loading-spinner {
        text-align: center;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role) && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Redirect /profile to /profile/:username
const OwnProfileRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={`/profile/${user?.username}`} replace />;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-accent-green)',
              secondary: 'var(--color-bg-primary)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'var(--color-bg-primary)',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetail />} />
          <Route path="tournaments/:id/vote" element={<TournamentVoting />} />
          <Route path="photographers" element={<Photographers />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="chat" element={<GlobalChat />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Own profile redirect */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <OwnProfileRedirect />
            </ProtectedRoute>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        {/* Employer Routes */}
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute roles={['employer']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployerDashboard />} />
        </Route>

        {/* Photographer Routes */}
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute roles={['photographer']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MyApplications />} />
        </Route>
        
        {/* Redirect /jobs/create to employer dashboard */}
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute roles={['employer']}>
              <Navigate to="/employer/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/tournaments/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminCreateTournament />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

