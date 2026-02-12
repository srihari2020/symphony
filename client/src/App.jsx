import { SocketProvider } from './context/SocketContext';

// ...

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
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
              <Route path="/community" element={<Community />} />
              <Route path="/invitations" element={<PendingInvitations />} />

              {/* Callbacks that need auth but maybe not layout? Keeping in layout for consistency or moving out if needed */}
              <Route path="/integrations/github/callback" element={<GitHubCallback />} />
              <Route path="/integrations/slack/callback" element={<SlackCallback />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
