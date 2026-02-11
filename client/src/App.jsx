import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import TeamMembers from './pages/TeamMembers';
import PendingInvitations from './pages/PendingInvitations';
import GitHubCallback from './pages/GitHubCallback';
import SlackCallback from './pages/SlackCallback';
import GitHubAuthCallback from './pages/GitHubAuthCallback';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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

          {/* Protected Routes with Persistent Layout */}
          <Route element={
            <PrivateRoute>
              <Layout><Outlet /></Layout>
            </PrivateRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/team" element={<TeamMembers />} />
            <Route path="/invitations" element={<PendingInvitations />} />

            {/* Callbacks that need auth but maybe not layout? Keeping in layout for consistency or moving out if needed */}
            <Route path="/integrations/github/callback" element={<GitHubCallback />} />
            <Route path="/integrations/slack/callback" element={<SlackCallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
