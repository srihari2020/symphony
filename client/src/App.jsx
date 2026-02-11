import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute><Signup /></PublicRoute>
          } />
          <Route path="/auth/github/callback" element={
            <GitHubAuthCallback />
          } />
          <Route path="/integrations/github/callback" element={
            <PrivateRoute><GitHubCallback /></PrivateRoute>
          } />
          <Route path="/integrations/slack/callback" element={
            <PrivateRoute><SlackCallback /></PrivateRoute>
          } />
          <Route path="/" element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />
          <Route path="/project/:id" element={
            <PrivateRoute>
              <Layout><ProjectDetail /></Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout><Settings /></Layout>
            </PrivateRoute>
          } />
          <Route path="/team" element={
            <PrivateRoute>
              <TeamMembers />
            </PrivateRoute>
          } />
          <Route path="/invitations" element={
            <PrivateRoute>
              <PendingInvitations />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
