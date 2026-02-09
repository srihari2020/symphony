import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

// Add auth header to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const googleAuth = (data) => api.post('/auth/google', data);
export const githubAuth = (data) => api.post('/auth/github', data);

// Organizations
export const getCurrentOrg = () => api.get('/organizations/current');
export const createOrg = (data) => api.post('/organizations', data);

// Projects
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const getProjectDashboard = (id) => api.get(`/projects/${id}/dashboard`);
export const refreshProject = (id) => api.post(`/projects/${id}/refresh`);

// Integrations
export const getIntegrations = () => api.get('/integrations');
export const getGitHubAuthUrl = () => api.get('/integrations/github/auth-url');
export const exchangeGitHubCode = (code) => api.post('/integrations/github/callback', { code });
export const getSlackAuthUrl = () => api.get('/integrations/slack/auth-url');
export const exchangeSlackCode = (code) => api.post('/integrations/slack/callback', { code });
export const disconnectIntegration = (type) => api.delete(`/integrations/${type}`);
export const getGitHubRepos = () => api.get('/integrations/github/repos');
export const getSlackChannels = () => api.get('/integrations/slack/channels');

export default api;
