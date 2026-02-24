import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import TeamMembers from './pages/TeamMembers';
import PendingInvitations from './pages/PendingInvitations';
import Community from './pages/Community';
import GitHubCallback from './pages/GitHubCallback';
import SlackCallback from './pages/SlackCallback';
import GitHubAuthCallback from './pages/GitHubAuthCallback';
import Analytics from './pages/Analytics';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/" />;
}

function LandingRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" /> : <Landing />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" /> : children;
}

import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute><Login /></PublicRoute>
              } />
              <Route path="/signup" element={
                <PublicRoute><Signup /></PublicRoute>
              } />
              <Route path="/auth/github/callback" element={
                <GitHubAuthCallback />
              } />

              {/* Landing page — public intro */}
              <Route path="/" element={
                <LandingRoute />
              } />

              {/* Protected Routes with Persistent Layout */}
              <Route element={
                <PrivateRoute>
                  <Layout><Outlet /></Layout>
                </PrivateRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/team" element={<TeamMembers />} />
                <Route path="/community" element={<Community />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/invitations" element={<PendingInvitations />} />

                {/* Callbacks that need auth but maybe not layout? Keeping in layout for consistency or moving out if needed */}
                <Route path="/integrations/github/callback" element={<GitHubCallback />} />
                <Route path="/integrations/slack/callback" element={<SlackCallback />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
