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

// AI
export const aiChat = (data) => api.post('/ai/chat', data);
export const aiGenerateTasks = (data) => api.post('/ai/generate-tasks', data);

// Unsplash
export const searchUnsplash = (q, page = 1) => api.get(`/unsplash/search?q=${encodeURIComponent(q)}&page=${page}`);
export const randomUnsplash = () => api.get('/unsplash/random');

// Chat
export const getChatMessages = (projectId, before) => api.get(`/chat/${projectId}/messages${before ? '?before=' + before : ''}`);
export const sendChatMessage = (projectId, content) => api.post(`/chat/${projectId}/messages`, { content });

// Analytics
export const getProjectAnalytics = (projectId) => api.get(`/analytics/${projectId}`);

// Files
export const getProjectFiles = (projectId) => api.get(`/files/${projectId}`);
export const uploadFile = (formData) => api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteFile = (id) => api.delete(`/files/${id}`);

export default api;

